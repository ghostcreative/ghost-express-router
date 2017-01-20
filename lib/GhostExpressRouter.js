'use strict';
const _ = require('lodash');
const Express = require('express');
const Joi = require('joi');
const Celebrate = require('celebrate');

const ConnectSequence = require('connect-sequence');

let _authService, _db, _permissionService, _logger;

class GhostExpressRouter {

  constructor () {
    this.Router = this._initRouter();
  }

  /**
   * @returns Router
   */
  register () {
    return this.Router;
  }

  /**
   * @param {AuthService} authService
   */
  set authService (authService) {
    _authService = authService;
  }

  /**
   * @param {GhostSequelize.db} db
   */
  set db (db) {
    _db = db;
  }

  /**
   * @param {PermissionService} permissionService
   */
  set permissionService (permissionService) {
    _permissionService = permissionService;
  }

  /**
   * @param {GhostLogger} logger
   */
  set logger (logger) {
    _logger = logger;
  }

  /**
   * @name GhostExpressRouter_RouteOptionsAuthConfig
   * @type {Object}
   * @property {'bearerJwt'} plugin
   * @property {[Permission.name]} permissions
   * @property {Boolean} includeModelServiceFromPermissions
   */

  /**
   *  @name GhostExpressRouter_RouteOptions
   *  @type {Object}
   *  @property {String} method
   *  @property {String} path
   *  @property {Function|[Function]} handler
   *  @property {GhostExpressRouter_RouteOptionsAuthConfig} auth
   */

  /**
   * @param {[GhostExpressRouter_RouteOptions]} routeOptions
   */
  configure (routeOptions) {
    if (!_.isArray(routeOptions)) throw new Error('GhostExpressRouter.configure - routeOptions must be an array.');
    _.each(routeOptions, option => {
      this.handle(option)
    });
  }

  /**
   * @param {GhostExpressRouter_RouteOptions|Function} routeOptions
   * @returns {GhostExpressRouter}
   */
  handle (routeOptions) {
    this._handle(routeOptions);
    return this;
  }

  /**
   * @param {String} method
   * @param {String} path
   * @param {Function} handler
   * @returns {GhostExpressRouter}
   */
  registerHandler (method, path, handler) {
    this.Router[method.toLowerCase()](path, handler);
    return this;
  }

  /**
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @param {Function} next
   * @private
   */
  _attachScopedModelServicesToRequest (req, res, next) {
    if (req.creds && _.isArray(req.creds.permissions)) {
      _.each(req.creds.permissions, permission => {
        const modelScope = _.head(req.creds.permissions).modelScope;
        const scope = modelScope.scopePropFromCred ? { 'method': [modelScope.name, _.head(_.at(req.creds, modelScope.scopePropFromCred))] } : modelScope.name;
        req[modelScope.model] = req.db[modelScope.model].scope(scope);
      });
    }

    delete req.db;
    next();
  }

  /**
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @param {Function} next
   * @private
   */
  _ensureAuthenticated (req, res, next) {
    _authService.authenticate(req, res)
    .tap(creds => req.creds = creds)
    .then(() => next())
    .catch(err => {
      this._logError('GhostExpressRouter._ensureAuthenticated failed', {
        err: err,
        body: req.body,
        params: req.params,
        query: req.query,
        creds: req.creds
      });
      res.boom.unauthorized(err.message);
    });
  }

  /**
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @param {Function} next
   * @private
   */
  _ensurePermitted (req, res, next) {
    _permissionService.permit(req, res)
    .tap(permissions => req.creds.permissions = permissions)
    .then(() => next())
    .catch(err => {
      this._logError('GhostExpressRouter._validatePermissions failed', {
        err: err,
        body: req.body,
        params: req.params,
        query: req.query,
        creds: req.creds
      });
      res.boom.forbidden(err.message);
    })
  }

  /**
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @param {Function} next
   * @private
   */
  _ensureValid (req, res, next) {
    if (_.isEmpty(req.routeOptions) || _.isEmpty(req.routeOptions.validate)) return next();
    Celebrate(req.routeOptions.validate)(req, res, (err) => {
      if (!err) return next();
      next(err);
    })
  }

  /**
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @param {Function} next
   * @private
   */
  _executeRouteHandlerSequence (req, res, next) {
    // 1) add routeOptions & db to request object
    req.routeOptions = this.routeOptions;
    req.db = _db;

    // 2) setup middleware connect sequence
    const seq = new ConnectSequence(req, res, next);
    const assignedHandlers = _.isArray(this.routeOptions.handler) ? this.routeOptions.handler : [this.routeOptions.handler];

    // 3) append required prerequisite middleware handlers
    seq.appendIf(this._shouldEnsureAuthenticatedRequest, this._ensureAuthenticated.bind(this));
    seq.appendIf(this._shouldEnsurePermittedRequest, this._ensurePermitted.bind(this))
    seq.appendIf(this._shouldEnsureValidRequest, this._ensureValid.bind(this));
    seq.appendIf(this._shouldAttachScopeModelsToRequest, this._attachScopedModelServicesToRequest.bind(this));
    // 4) add middleware handlers correctly to sequence
    seq.append(...assignedHandlers);

    // 5) run sequence
    seq.run();
  }

  /**
   * @param {GhostExpressRouter_RouteOptions|[GhostExpressRouter_RouteOptions]} routeOptions
   */
  _handle (routeOptions) {
    if (!_.isArray(routeOptions.handler)) routeOptions.handler = [routeOptions.handler];

    this.registerHandler(
      routeOptions.method,
      routeOptions.path,
      this._executeRouteHandlerSequence.bind({
        routeOptions,
        _attachScopedModelServicesToRequest: this._attachScopedModelServicesToRequest,
        _ensureAuthenticated: this._ensureAuthenticated,
        _ensurePermitted: this._ensurePermitted,
        _ensureValid: this._ensureValid,
        _logError: this._logError,
        _shouldAttachScopeModelsToRequest: this._shouldAttachScopeModelsToRequest,
        _shouldEnsureAuthenticatedRequest: this._shouldEnsureAuthenticatedRequest,
        _shouldEnsurePermittedRequest: this._shouldEnsurePermittedRequest,
        _shouldEnsureValidRequest: this._shouldEnsureValidRequest
      })
    );
  }

  /**
   * @returns {Express.Router}
   * @private
   */
  _initRouter () {
    const Router = Express.Router();
    return Router;
  }

  /**
   * @param {String} errMessage
   * @param {Error} err
   * @private
   */
  _logError (errMessage, err) {
    if (this._logger) this._logger.error(errMessage, err);
  }

  /**
   * @param {Express.Request} req
   * @returns {Boolean}
   * @private
   */
  _shouldAttachScopeModelsToRequest (req) {
    return !_.isEmpty(req.routeOptions.auth) && !_.isEmpty(req.routeOptions.auth.permissions);
  }

  /**
   * @param {Express.Request} req
   * @returns {Boolean}
   * @private
   */
  _shouldEnsureAuthenticatedRequest (req) {
    return !_.isEmpty(req.routeOptions.auth)
  }

  /**
   * @param {Express.Request} req
   * @returns {Boolean}
   * @private
   */
  _shouldEnsurePermittedRequest (req) {
    return !_.isEmpty(req.routeOptions.auth) && !_.isEmpty(req.routeOptions.auth.permissions);
  }

  /**
   * @param {Express.Request} req
   * @returns {Boolean}
   * @private
   */
  _shouldEnsureValidRequest (req) {
    return !_.isEmpty(req.routeOptions.validate);
  }

}

module.exports = GhostExpressRouter;
