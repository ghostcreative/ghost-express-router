'use strict';

const AuthService = require('./authService');
const BearerJwtPlugin = require('./plugins/bearerJwtPlugin');
const DefaultValidateFn = require('./defaults/validateFunc');
const DefaultLoginFn = require('./defaults/loginFunc');
const DefaultRegisterFn = require('./defaults/registerFunc');

class AuthServiceFactory {

  /**
   * @name GhostExpressRouter_AuthServiceConfig
   * @type {Object}
   * @property {String} authSecret
   * @property {'bearerJwt'} plugin
   * @property {Function} validateFn
   * @property {Function} loginFn
   * @property {Function} validateFn
   * @property {Function} registerFn
   */

  /**
   * @param {GhostExpressRouter_AuthServiceConfig} options
   * @param {Sequelize} [db]
   * @return {AuthService}
   */
 static create (options, db) {
    const authPlugin = AuthServiceFactory.resolveAuthPlugin(options.plugin);
    const validateFn = AuthServiceFactory.resolveValidateFn(options.validateFn, db);
    const loginFn = AuthServiceFactory.resolveLoginFn(options.loginFn, db);
    const registerFn = AuthServiceFactory.resolveRegisterFn(options.registerFn, db);
    return new AuthService(authPlugin, { validateFn, loginFn, registerFn, authSecret: options.authSecret });
  }

  static resolveAuthPlugin (plugin) {
    if (plugin == 'bearerJwt') return BearerJwtPlugin;

    throw new Error(`GhostExpressRouterError: AuthServiceFactory.resolveAuthPlugin - Unknown auth plugin "${plugin}"`);
  }

  /**
   * @param {Function} [validateFn]
   * @param {Sequelize} [db]
   * @return {Function}
   */
  static resolveValidateFn (validateFn, db) {
    if (validateFn) return validateFn;
    if (!validateFn && !db) throw new Error('GhostExpressRouterError: AuthServiceFactory.resolveValidateFn - Missing validateFn and database.');

    DefaultValidateFn.registerDb(db);
    return DefaultValidateFn;
  }

  /**
   * @param {Function} [loginFn]
   * @param {Sequelize} [db]
   * @return {Function}
   */
  static resolveLoginFn (loginFn, db) {
    if (loginFn) return loginFn;
    if (!loginFn && !db) throw new Error('GhostExpressRouterError: AuthServiceFactory.resolveLoginFn - Missing loginFn and database.');

    DefaultLoginFn.registerDb(db);
    return DefaultLoginFn;
  }

  /**
   * @param {Function} [registerFn]
   * @param {Sequelize} [db]
   * @return {Function}
   */
  static resolveRegisterFn (registerFn, db) {
    if (registerFn) return registerFn;
    if (!registerFn && !db) throw new Error('GhostExpressRouterError: AuthServiceFactory.resolveRegisterFn - Missing registerFn and database.');

    DefaultRegisterFn.registerDb(db);
    return DefaultRegisterFn;
  }

}

module.exports = AuthServiceFactory;