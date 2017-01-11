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

  /**
   * @param {Object} creds
   * @param {User} creds.user
   * @param {Profile} creds.profile
   * @param {[Role.name]} creds.roles
   * @param {GhostExpressRouter_RouteOptions} routeOptions
   */
  ensurePermitted (creds, routeOptions) {
    const assignedPermissions = _.keys(routeOptions);
    return this._db.permission.findAll({
      where: {
        name: { $in: [assignedPermissions] }
      },
      include: [
        { model: this._db.role, where: { name: req.creds.role }, required: true },
        { model: this._db.modelScope }
      ]
    })
    .then(permissions => {
      if (_.isEmpty(permissions)) throw new Error(`Missing permissions. One of the following required: ${assignedPermissions.toString()}`);
      return permissions;
    })
  }

}

module.exports = PermissionService;