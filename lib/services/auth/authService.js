'use strict';

class AuthService {

  /**
   * @param {Object} authPlugin
   * @param {GhostExpressRouter_AuthServiceConfig} options
   */
  constructor (authPlugin, options) {
    this._authPlugin = authPlugin;
    this._authSecret = options.authSecret;
    this._validateFn = options.validateFn;
    this._loginFn = options.loginFn;
    this._registerFn = options.registerFn;
    this._resetPasswordFn = options.resetPasswordFn;
    this._verifyResetTokenFn = options.verifyResetTokenFn;
  }

  /**
   * @param {Request} req
   * @param {Response} res
   */
  authorized (req, res) {
    return this._authPlugin.validateRequest(req, this._authSecret)
    .then(decoded => this._validateFn.execute(decoded))
  }

  /**
   * @param {Request} req
   * @param {Response} res
   */
  login (req, res) {
    return this._loginFn.execute(req, res)
  }

  /**
   * @param {Request} req
   * @param {Response} res
   */
  register (req, res) {
    return this._registerFn.execute(req, res)
  }

  // /**
  //  * @param {Request} req
  //  * @param {Response} res
  //  * @param {Function} next
  //  */
  // resetPassword (req, res, next) {
  //
  // }
  //
  // /**
  //  * @param {Request} req
  //  * @param {Response} res
  //  * @param {Function} next
  //  */
  // requestPasswordReset (req, res, next) {
  //
  // }
  //
  // /**
  //  * @param {Request} req
  //  * @param {Response} res
  //  * @param {Function} next
  //  */
  // verifyResetToken (req, res, next) {
  //
  // }

}

module.exports = AuthService;