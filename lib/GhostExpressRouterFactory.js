'use strict';
const Express = require('express');
const Router = Express.Router();

const GhostExpressRouter = require('./GhostExpressRouter');
const AuthRouter = require('./routes/auth/routers/authRouter');
const BadRequestError = require('./errors/BadRequest');
const ForbiddenError = require('./errors/Forbidden');

const PermissionServiceFactory = require('./services/permission/permissionServiceFactory');
const AuthServiceFactory = require('./services/auth/authServiceFactory');

class GhostExpressRouterFactory {

  /**
   *  @name GhostExpressPermissions_AuthServiceConfig
   *	@type {Object}
   *	@property {String} authSecret
   *	@property {'bearerJwt'} plugin
   *  @property {Function} validateFn
   *  @property {Function} loginFn
   *  @property {Function} registerFn
   *  @property {Function} resetPasswordFn
   *  @property {Function} verifyResetTokenFn
   */

  /**
   *  @name GhostExpressPermissions_Config
   *	@type {Object}
   *	@property {GhostExpressPermissions_AuthServiceConfig} auth
   *  @property {GhostExpressPermission_PermissionServiceConfig} permission
   */

  /**
   * @param {GhostExpressPermissions_Config} options
   * @param {Sequelize} Db
   * @param {Logger} Logger
   * @param {NewRelicService} NewRelicService
   */
  constructor (options, Db, Logger, NewRelicService) {

    // services
    const AuthService = AuthServiceFactory.create(options.auth, Db);
    const PermissionService = PermissionServiceFactory.create(options.permission, Db);

    return new GhostExpressRouter(BadRequestError, ForbiddenError, Router, AuthRouter, AuthService, PermissionService, Logger, NewRelicService);
  }

}

module.exports = GhostExpressRouterFactory;