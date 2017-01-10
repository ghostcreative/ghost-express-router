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
   * @param {AuthService} AuthService
   * @param {PermissionService} PermissionService
   * @param {Logger} Logger
   * @param {NewRelicService} NewRelicService
   */
  constructor (BadRequestError, ForbiddenError, Router, AuthRouter, AuthService, PermissionService, Logger, NewRelicService) {
    this.ErrorHandler = ErrorHandlerFactory.create({ Logger, NewRelicService });
    this.BadRequest = BadRequestError;
    this.Forbidden = ForbiddenError;
    this.AuthService = AuthService;
    this.PermissionService = PermissionService;
    this.AuthRouter = AuthRouter(AuthService);
    this.Router = Router;
  }

  getAuthRouter () {
    return this.AuthRouter;
  }

  setAuthRouter (Router) {
    this.AuthRouter = Router;
    return this;
  }

  getRouter () {
    return this.Router;
  }

  setRouter (Router) {
    this.Router = Router;
    return this;
  }

  handle (method, path, routeOptions) {
    if (_.isFunction(routeOptions)) this.Router[method.toLowerCase()](path, routeOptions);
    else this.Router[method.toLowerCase()](path, this.validatePermissions.bind(this), this._resolveRouterHandler.bind({ routeOptions }));
    return this;
  }

  validatePermissions (req, res, next) {
    this.AuthService.authorized(req, res)
    .tap(creds => req.creds = creds)
    .then(() => this.PermissionService.attachRolePermissionsToRequest(req, res))
    .then(() => next())
    .catch(err => {
      if (err && err.message == 'Missing authorization token.') next(new res.Unauthorized(err));
      else next(err)
    })
  }

  _resolveRouterHandler (req, res, next) {
    if (!req.creds) return next(new res.Forbidden());

    const permissions = _.map(req.creds.permissions, 'permissionName');
    const assignedPermissions = _.keys(this.routeOptions);
    const assignedHandler = this.routeOptions[_.head(_.intersection(permissions, assignedPermissions))];

    if (!assignedHandler) next(new res.Forbidden());
    else if (_.isFunction(assignedHandler)) assignedHandler(req, res, next);
    else if (_.isArray(assignedHandler)) {
      const seq = new ConnectSequence(req, res, next);
      seq.append(...assignedHandler);
      seq.run();
    }
    else next(new res.InternalServerError);
  }

}

module.exports = GhostExpressRouter;