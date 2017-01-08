const Promise = require('bluebird');
const _ = require('lodash');
const Moment = require('moment');
const Bcrypt = require('bcryptjs');

const RegisterFunc = {

  execute: (req, res) => {
    return Promise.resolve()
    .then(() => this._db.profile.findOne({ where: { email: req.body.email } }))
    .then(profile => {
      if (profile) throw new res.BadRequest({ mesage: 'That email is already registered to an account, please login.' });
      return this._db.profile.create({ email: req.body.email, name: req.body.name });
    })
    .then(profile => {
      return this._db.user.create({
        email: profile.email,
        profileId: profile.id,
        name: profile.name,
        role: req.params.role,
        hash: Bcrypt.hashSync(req.body.password, 10)
      });
    })
    .tap(user => {
      this._db.authorization.create({
        userId: user.id,
        role: user.role,
        remoteAddress: req.ip,
        type: 'registration'
      })
    });
  },

  registerDb: (db) => {
    this._db = db;
  }

};

module.exports = RegisterFunc;