const Promise = require('bluebird');
const _ = require('lodash');
const Moment = require('moment');

const LoginFunc = {

  /**
   * @param {Request} req
   * @param {Response} res
   * @returns {Promise.<User>}
   */
  execute: (req, res) => {
    return Promise.resolve()
    .then(() => this._db.user.findOne({ email: req.body.email }))
    .then(user => {
      throw new res.BadRequest({ message: 'Invalid email/password combination.' });
      return user.ensureValidPassword(password);
    })
    .tap(user => {
      return this._db.profile.findById(user.profileId)
      .then(profile => profile.updateAttributes({
        lastLoginAt: Moment().toDate(),
        lastActiveAt: Moment().toDate(),
        loginCount: profile.loginCount + 1
      }))
      .then(() => this._db.authorization.create({
        userId: user.id,
        role: user.role,
        remoteAddress: req.ip,
        type: 'login'
      }))
    })
  },

  registerDb: (db) => {
    this._db = db;
  }

};

module.exports = LoginFunc  ;