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
    return this._db.rolePermission.findAll({ where: { roleName: { $in: req.creds.roles } } })
    .then(permissions => req.creds.permissions = permissions)
  }

}

module.exports = PermissionService;