const Promise = require('bluebird');
const _ = require('lodash');
const Moment = require('moment');

const ValidateFunc = {

  execute: (decoded) => {
    return Promise.resolve()
    .then(() => {
      if (!decoded.user || !decoded.expires || !decoded.role) {
        throw new Error('Malformed authorization token, please sign in.');
      }

      if (Moment(decoded.expires).isBefore(Moment())) {
        throw new Error('Authorization token has expired, please sign in.');
      }

      let user, profile, roles;
      return Promise.resolve()
      .then(() => this._db.user.findById(decoded.user, { include: [{ model: this._db.profile }] }))
      .tap(_user_ => user = _user_)
      .then(() => this._db.userRole.findOne({
        where: { userId: user.id },
        include: [{ model: this._db.role, where: { name: decoded.role }, required: true }]
      }))
      .then(userRole => {
        const roles = userRole ? userRole.roleName : '';
        const creds = {};
        creds.user = _.clone(user.dataValues);
        creds.profile = _.clone(user.profile.dataValues);
        creds.roles = _.clone(roles);
        return creds;
      })

    })
  },

  registerDb: (db) => {
    this._db = db;
  }

};

module.exports = ValidateFunc;