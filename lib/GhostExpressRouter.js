'use strict';
const _ = require('lodash');
const Express = require('express');
const ConnectSequence = require('connect-sequence');

const AuthServiceFactory = require('./services/auth/authServiceFactory');
const PermissionServiceFactory = require('./services/permission/permissionServiceFactory');

const AuthRouter = require('./routes/auth/routers/authRouter');

const ErrorHandlerFactory = require('./errors/GhostExpressRouterErrorHandlerFactory');

class GhostExpressRouter {

  /**
   * @param {Sequelize} Db
   * @param {Logger} Logger
   * @param {NewRelicService} NewRelicService
   */
  constructor (Db, Logger, NewRelicService) {
    this.Router = Express.Router();
    this.ErrorHandler = ErrorHandlerFactory.create({ Logger, NewRelicService });
    this.Logger = Logger;

    this._db = Db;
  }

  // /**
  //  * @returns {AuthRouter}
  //  */
  // getAuthRouter () {
  //
  //   return this.AuthRouter;
  // }
  //
  // /**
  //  * @param Router
  //  * @returns {GhostExpressRouter}
  //  */
  // setAuthRouter (Router) {
  //   this.AuthRouter = Router;
  //   return this;
  // }

  /**
   * @returns Router
   */
  getRouter () {
    console.log("GET ROUTER");
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
    if (_.isEmpty(routeOptions.auth)) this._handleNonAuthorized(routeOptions);
    else if (_.isEmpty(routeOptions.auth.permissions)) this._handleAuthorized(routeOptions);
    else this._handlePermissioned(routeOptions);
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
   * @param {GhostExpressRouter_RouteOptions|[GhostExpressRouter_RouteOptions]} routeOptions
   */
  _handleNonAuthorized (routeOptions) {
    if (_.isFunction(routeOptions.handler)) this.registerHandler(routeOptions.method, routeOptions.path, routeOptions.handler);
    else if (_.isArray(routeOptions.handler)) _.each(routeOptions.handler, handler => this.registerHandler(routeOptions.method, routeOptions.path, handler))
    else throw new Error('GhostExpressRouter.handle - invalid routeOptions handler provided. Must be array or function.');
  }

  /**
   * @param {GhostExpressRouter_RouteOptions|[GhostExpressRouter_RouteOptions]} routeOptions
   */
  _handleAuthorized (routeOptions) {
    if (!_.isArray(routeOptions.handler)) routeOptions.handler = [routeOptions.handler];

    this.registerHandler(
      routeOptions.method,
      routeOptions.path,
      this._resolveRouteHandlerSequence.bind({
        routeOptions,
        _db: this._db,
        _validateToken: this._validateToken,
        _logError: this._logError
      })
    )
  }

  /**
   * @param {GhostExpressRouter_RouteOptions|[GhostExpressRouter_RouteOptions]} routeOptions
   */
  _handlePermissioned (routeOptions) {
    if (!_.isArray(routeOptions.handler)) routeOptions.handler = [routeOptions.handler];

    this.registerHandler(
      routeOptions.method,
      routeOptions.path,
      this._resolvePermissionedRouteHandlerSequence.bind({
        routeOptions,
        _attachRouteModelServiceFromModelScope: this._attachRouteModelServiceFromModelScope,
        _db: this._db,
        _logError: this._logError,
        _resolveRouteHandlerSequence: this._resolveRouteHandlerSequence,
        _validateToken: this._validateToken,
        _validatePermissions: this._validatePermissions
      })
    );
  }

  /**
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @param {Function} next
   * @private
   */
  _validateToken (req, res, next) {
    const AuthService = AuthServiceFactory.create(this.routeOptions.auth, this._db);

    AuthService.authorized(req, res)
    .tap(creds => req.creds = creds)
    .tap(() => console.log("authorized", req.creds))
    .then(() => next())
    .catch(err => {
      this._logError('GhostExpressRouter._validatePermissions failed', { err: err, body: req.body, params: req.params, query: req.query, creds: req.creds });
      next(new res.Unauthorized(err));
    });
  }

  /**
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @param {Function} next
   * @private
   */
  _validatePermissions (req, res, next) {
    const PermissionService = PermissionServiceFactory.create({}, this._db);

    PermissionService.ensurePermitted(req.creds, this.routeOptions)
    .tap(permissions => req.creds.permissions = permissions)
    .then(() => next())
    .catch(err => {
      this._logError('GhostExpressRouter._validatePermissions failed', { err: err, body: req.body, params: req.params, query: req.query, creds: req.creds });
      next(new res.Forbidden(err));
    })
  }

  /**
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @param {Function} next
   * @private
   */
  _resolveRouteHandlerSequence (req, res, next) {
    // 1) setup middleware connect sequence
    const seq = new ConnectSequence(req, res, next);
    const assignedHandler = this.routeOptions.handler;
    seq.append(this._validateToken);

    // 2) add handlers correctly to sequence
    _.isArray(assignedHandler) ? seq.append(...assignedHandler) : seq.append(assignedHandler);

    // 3) run sequence
    seq.run();

  }

  /**
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @param {Function} next
   * @private
   */
  _resolvePermissionedRouteHandlerSequence (req, res, next) {
    const assignedHandlers = _.isArray(this.routeOptions.handler) ? this.routeOptions.handler : [this.routeOptions.handler];
    const attachServicesHandlers = [];
    _.each(assignedHandlers, () => attachServicesHandlers.push(this._attachScopedModelServicesToRequest));

    this.routeOptions.handlers = _.zip(attachServicesHandlers, assignedHandlers);
    this._resolveRouteHandlerSequence(req, res, next);
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
        const modelScope = _.head(creds.permissions).modelScope;
        const serviceName = `${modelScope.model}Service`;
        req[serviceName] = this._db[modelScope.model].scope(modelScope.name);
      });
    }
    next();
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