'use strict';
const _ = require('lodash');
const Express = require('express');
const Boom = require('express-boom');
const Joi = require('joi');
const Celebrate = require('celebrate');
const BodyParser = require('body-parser');

const ConnectSequence = require('connect-sequence');

const AuthServiceFactory = require('./services/auth/authServiceFactory');
const PermissionServiceFactory = require('./services/permission/permissionServiceFactory');
const ValidateServiceFactory = require('./services/validate/validateServiceFactory');

class GhostExpressRouter {

  // TODO - ghost-express-server
  // TODO - remove validation from ghost-express-server
  // TODO - remove http-responses from ghost-express-server
  // TODO - ensure errorHandler in ghost-express-server works with new Celebrate framework https://github.com/continuationlabs/celebrate

  // TODO - ghost-express-router
  // TODO - create interface in ghost-express-server to directly load ghost-express-routers
  // TODO - add cache-control https://www.npmjs.com/package/express-cache-control

  /**
   * @param {Object} options
   * @param {Sequelize} options.db
   * @param {Logger} options.logger
   */
  constructor (options) {
    this._db = options.db;
    this._logger = options.logger;

    this.Router = this._initRouter();
  }

  /**
   * @returns Router
   */
  register () {
    return this.Router;
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
        const modelScope = _.head(creds.permissions).modelScope;
        const serviceName = `${modelScope.model}Service`;
        req[serviceName] = req.db[modelScope.model].scope(modelScope.name);
      });
    }

    delete req.db; // TODO - figure out a better way of getting db to this method
    next();
  }

  /**
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @param {Function} next
   * @private
   */
  _ensureAuthenticated (req, res, next) {
    const AuthService = AuthServiceFactory.create(req.routeOptions.auth, req.db);

    AuthService.authenticate(req, res)
    .tap(creds => req.creds = creds)
    .tap(() => console.log("authenticated", req.creds))
    .then(() => next())
    .catch(err => {
      this._logError('GhostExpressRouter._ensureAuthenticated failed', { err: err, body: req.body, params: req.params, query: req.query, creds: req.creds });
      res.boom.wrap(err, 401);
    });
  }

  /**
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @param {Function} next
   * @private
   */
  _ensurePermitted (req, res, next) {
    const PermissionService = PermissionServiceFactory.create({}, this._db);

    PermissionService.ensurePermitted(req.creds, req.routeOptions)
    .tap(permissions => req.creds.permissions = permissions)
    .then(() => next())
    .catch(err => {
      this._logError('GhostExpressRouter._validatePermissions failed', { err: err, body: req.body, params: req.params, query: req.query, creds: req.creds });
      res.boom.wrap(err, 403);
    })
  }

  /**
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @param {Function} next
   * @private
   */
  _ensureValid (req, res, next) {
    if (_.isEmpty(req.routeOptions) || _.isEmpty(req.routeOptions.validate)) next();
    else Celebrate(req.routeOptions.validate)(req, res, next);
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
    req.db = this._db;

    // 2) setup middleware connect sequence
    const seq = new ConnectSequence(req, res, next);
    const assignedHandlers = _.isArray(this.routeOptions.handler) ? this.routeOptions.handler : [this.routeOptions.handler];


    // 3) append required prerequisite middleware handlers
    seq.appendIf(this._shouldEnsureAuthenticatedRequest, this._ensureAuthenticated);
    seq.appendIf(this._shouldEnsurePermittedRequest, this._ensurePermitted);
    seq.appendIf(this._shouldEnsureValidRequest, this._ensureValid);
    seq.appendIf(this._shouldAttachScopeModelsToRequest, this._attachScopedModelServicesToRequest);

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
        _attachRouteModelServiceFromModelScope: this._attachRouteModelServiceFromModelScope,
        _db: this._db,
        _logError: this._logError,
        _shouldAttachScopeModelsToRequest: this._shouldAttachScopeModelsToRequest,
        _shouldEnsureAuthenticatedRequest: this._shouldEnsureAuthenticatedRequest,
        _shouldEnsurePermittedRequest: this._shouldEnsurePermittedRequest,
        _shouldEnsureValidRequest: this._shouldEnsureValidRequest,
        _validateToken: this._validateToken,
        _validatePermissions: this._validatePermissions
      })
    );
  }

  /**
   * @returns {Express.Router}
   * @private
   */
  _initRouter () {
    const Router = Express.Router();
    Router.use(Boom());
    Router.use(BodyParser.json());
    return Router;
  }

  /**
   * @param {String} errMessage
   * @param {Error} err
   * @private
   */
  _logError (errMessage, err) {
    this._logger ? this._logger.error(errMessage, err) : null;
  }

  /**
   * @param {Express.Request} req
   * @returns {Boolean}
   * @private
   */
  _shouldAttachScopeModelsToRequest (req) {
    return this._shouldEnsurePermittedRequest(req);
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
    return !_.isEmpty(req.routeOptions.auth) && !_.isEmptY(req.routeOptions.auth.permissions);
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