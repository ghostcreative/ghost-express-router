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
  // TODO - add validation via Joi https://www.npmjs.com/package/express-joi
  // TODO - create interface in ghost-express-server to directly load ghost-express-routers
  // TODO - add cache-control https://www.npmjs.com/package/express-cache-control
  // TODO - move this.Router init to its own setup method or setup directory

  /**
   * @param {Object} options
   * @param {Sequelize} options.db
   * @param {Logger} options.logger
   */
  constructor (options) {
    this._db = options.db;
    this._logger = options.logger;

    this.Router = Express.Router();
    this.Router.use(Boom());
    this.Router.use(BodyParser.json());
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
    this._attachValidateHandler(routeOptions);
    if (_.isFunction(routeOptions.handler)) this.registerHandler(routeOptions.method, routeOptions.path, routeOptions.handler);
    else if (_.isArray(routeOptions.handler)) _.each(routeOptions.handler, handler => this.registerHandler(routeOptions.method, routeOptions.path, handler));
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
      this._executeRouteHandlerSequence.bind({
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
      this._executePermissionedRouteHandlerSequence.bind({
        routeOptions,
        _attachRouteModelServiceFromModelScope: this._attachRouteModelServiceFromModelScope,
        _db: this._db,
        _logError: this._logError,
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
  _ensureAuthenticated (req, res, next) {
    const AuthService = AuthServiceFactory.create(req.routeOptions.auth, req.db);

    AuthService.authenticate(req, res)
    .tap(creds => req.creds = creds)
    .tap(() => console.log("authenticated", req.creds))
    .then(() => next())
    .catch(err => {
      this._logError('GhostExpressRouter._ensureAuthenticated failed', { err: err, body: req.body, params: req.params, query: req.query, creds: req.creds });
      next(new res.Unauthorized(err));
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
  _ensureValidated (req, res, next) {
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
    const assignedHandler = this.routeOptions.handler;

    // 3) append required prerequisite middleware handlers
    seq.append(this._ensureAuthenticated);
    seq.append(this._ensureValidated);

    // 4) add middleware handlers correctly to sequence
    _.isArray(assignedHandler) ? seq.append(...assignedHandler) : seq.append(assignedHandler);

    // 5) run sequence
    seq.run();

  }

  /**
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @param {Function} next
   * @private
   */
  _executePermissionedRouteHandlerSequence (req, res, next) {
    // 1) add routeOptions & db to request object
    req.routeOptions = this.routeOptions;
    req.db = this._db;

    // 2) setup middleware connect sequence
    const seq = new ConnectSequence(req, res, next);
    const assignedHandlers = _.isArray(this.routeOptions.handler) ? this.routeOptions.handler : [this.routeOptions.handler];


    // 3) append required prerequisite middleware handlers
    seq.append(this._ensureAuthenticated);
    seq.append(this._ensurePermitted);
    seq.append(this._ensureValidated);
    seq.append(this._attachScopedModelServicesToRequest);

    // 4) add middleware handlers correctly to sequence
    seq.append(...assignedHandlers);

    // 5) run sequence
    seq.run();
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
   * @param {String} errMessage
   * @param {Error} err
   * @private
   */
  _logError (errMessage, err) {
    this._logger ? this._logger.error(errMessage, err) : null;
  }

}

module.exports = GhostExpressRouter;