'use strict';
const ConnectSequence = require('connect-sequence');
const _ = require('lodash');
const ErrorHandlerFactory = require('./errors/GhostExpressRouterErrorHandlerFactory');

class GhostExpressRouter {

  /**
   * @param {BadRequest} BadRequestError
   * @param {Forbidden} ForbiddenError
   * @param {Router} Router
   * @param {Router} AuthRouter
   * @param {Sequelize} Db
   * @param {AuthService} AuthService
   * @param {PermissionService} PermissionService
   * @param {Logger} Logger
   * @param {NewRelicService} NewRelicService
   */
  constructor (BadRequestError, ForbiddenError, Router, AuthRouter, Db, AuthService, PermissionService, Logger, NewRelicService) {
    this.ErrorHandler = ErrorHandlerFactory.create({ Logger, NewRelicService });
    this.BadRequest = BadRequestError;
    this.Forbidden = ForbiddenError;
    this.AuthService = AuthService;
    this.PermissionService = PermissionService;
    this.AuthRouter = AuthRouter(AuthService);
    this.Router = Router;
    this.Logger = Logger;

    this._db = Db;
  }

  /**
   * @returns {AuthRouter}
   */
  getAuthRouter () {
    return this.AuthRouter;
  }

  /**
   * @param Router
   * @returns {GhostExpressRouter}
   */
  setAuthRouter (Router) {
    this.AuthRouter = Router;
    return this;
  }

  /**
   * @returns Router
   */
  getRouter () {
    return this.Router;
  }

  /**
   * @param Router
   * @returns {GhostExpressRouter}
   */
  setRouter (Router) {
    this.Router = Router;
    return this;
  }

  handle (method, path, routeOptions) {
    if (_.isFunction(routeOptions)) this.Router[method.toLowerCase()](path, routeOptions);
    else {
      this.Router[method.toLowerCase()](
        path,
        this.validatePermissions.bind(this),
        this._resolveRouterHandler.bind({
          routeOptions,
          _db: this._db,
          _logError: this._logError,
          _resolveRouteModelServiceFromModelScope: this._resolveRouteModelServiceFromModelScope
        })
      );
    }
    return this;
  }

  /**
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @param {Function} next
   */
  validatePermissions (req, res, next) {
    this.AuthService.authorized(req, res)
    .tap(creds => req.creds = creds)
    .then(() => this.PermissionService.attachRolePermissionsToRequest(req, res))
    .then(() => next())
    .catch(err => {
      this._logError('GhostExpressRouter.validatePermissions failed', {
        err: err,
        body: req.body,
        params: req.params,
        query: req.query,
        creds: req.creds
      });
      if (err && err.message == 'Missing authorization token.') next(new res.Unauthorized(err));
      else next(err)
    })
  }

  /**
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @param {Function} next
   * @private
   */
  _resolveRouterHandler (req, res, next) {
    if (!req.creds) return next(new res.Forbidden());

    const permissions = req.creds.permissions;
    const permissionNames = _.map(req.creds.permissions, 'name');
    const assignedPermissions = _.keys(this.routeOptions);
    const matchingPermissionName = _.head(_.intersection(permissionNames, assignedPermissions));
    const matchingPermission = _.find(permissions, _.matchesProperty('name', matchingPermissionName));
    const assignedHandler = this.routeOptions[matchingPermissionName];

    if (!assignedHandler) next(new res.Forbidden());
    else if (_.isFunction(assignedHandler)) this._resolveRouteModelServiceFromModelScope(matchingPermission.modelScope, assignedHandler)(req, res, next);
    else if (_.isArray(assignedHandler)) {
      const seq = new ConnectSequence(req, res, next);
      seq.appendList(_.each(assignedHandler, handler => this._resolveRouteModelServiceFromModelScope(matchingPermission.modelScope, handler)));
      seq.run();
    }
    else {
      this._logError('GhostExpressRouter._resolveRouterHandler failed', {
        body: req.body,
        params: req.params,
        query: req.query,
        creds: req.creds
      });
      next(new res.InternalServerError());
    }
  }

  /**
   * @param {ModelScope} modelScope
   * @param {Function} handler
   * @returns {Function}
   * @private
   */
  _resolveRouteModelServiceFromModelScope (modelScope, handler) {
    try {
      const service = this._db[modelScope.model].scope(modelScope.name);
      handler.bind({ service });
      return handler;
    } catch (err) {
      this._logError('GhostExpressRouter._resolveRouteModelServiceFromModelScope failed', err);
      throw err;
    }
  }

  /**
   * @param {String} errMessage
   * @param {Error} err
   * @private
   */
  _logError (errMessage, err) {
    this.Logger ? this.Logger.error(errMessage, err) : null;
  }

}

module.exports = GhostExpressRouter;