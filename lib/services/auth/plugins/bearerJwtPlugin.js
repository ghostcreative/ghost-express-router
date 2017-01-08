'use strict';

const Promise = require('bluebird');
const Jwt = require('jwt-simple');

class BearerJwtPlugin {


  /**
   * @param {Request} req
   * @param {String} secret
   * @returns {Promise.<>}
   */
  static validateRequest (req, secret) {
    if (!secret) throw new Error ('GhostExpressPermissionsError: bearerJwt.validateRequest - Missing authorization secret.');
    return Promise.resolve()
    .then(() => BearerJwtPlugin._extractTokenFromRequest(req))
    .then(token => BearerJwtPlugin._decodeToken(token, secret))
  }

  static _extractTokenFromRequest (req) {
    let token;
    return Promise.resolve()
    .then(() => {
      // 1) Authorization Header
      if (req.headers && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length !== 2) throw new Error('Invalid authorization header.');
        const scheme = parts[0];
        const credentials = parts[1];

        if (/^Bearer$/i.test(scheme)) token = credentials
      }

      // 2) Request Body
      if (req.body && req.body.access_token) {
        if (token) throw new Error('Authorization token set in multiple places.');
        token = req.body.access_token;
      }

      // 3) Query Param
      if (req.query && req.query.access_token) {
        if (token) throw new Error('Authorization token set in multiple places.');
        token = req.query.access_token;
      }


      return token;

    })
  }

  static _decodeToken (token, secret) {
    if (!token) throw new Error('Missing authorization token.');
    return Jwt.decode(token, secret);
  }

  static _encodeToken (token, secret) {
    if (!token) throw new Error('Missing authorization token.');
    return Jwt.encode(token, secret);
  }

};

module.exports = BearerJwtPlugin;