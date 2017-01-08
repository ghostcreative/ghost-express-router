'use strict';

class AuthRouteController {

  /**
   * @param {AuthService} authService
   */
  constructor (authService) {
    this._authService = authService;
  }

  /**
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   */
  authorized (req, res, next) {
    this._authService.authorized(req, res)
    .then(creds => req.creds = creds)
    .then(() => next())
    .catch(err => next(err))
  }

  /**
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   */
  login (req, res, next) {
    this._authService.login(req, res)
    .then(user => next(user))
    .catch(err => next(err))
  }

  /**
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   */
  register (req, res, next) {
    this._authService.register(req, res)
    .then(user => next(user))
    .catch(err => next(err))
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

module.exports = AuthRouteController;