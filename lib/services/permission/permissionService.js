'use strict';

const _ = require('lodash');

class PermissionService {

  /**
   * @param {GhostExpressPermission_PermissionServiceConfig} options
   * @param {Sequelize} db
   */
  constructor (options, db) {
    this._db = db;
  }

  /**
   * @param {Request} req
   * @param {Response} res
   */
  attachRolePermissionsToRequest (req, res) {
    return this._db.permission.findAll({
      include: [
        { model: this._db.role, where: { name: { $in: req.creds.roles }}, required: true },
        { model: this._db.modelScope }
      ]
    })
    .then(permission => req.creds.permissions = permission)
  }

}

module.exports = PermissionService;