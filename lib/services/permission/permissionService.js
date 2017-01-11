'use strict';

const _ = require('lodash');

class PermissionService {

  /**
   * @param {GhostExpressRouter_PermissionServiceConfig} options
   */
  constructor (options) {
    this._attachFn = options.attachFn;
  }

  /**
   * @param {Object} creds
   * @param {User} creds.user
   * @param {Profile} creds.profile
   * @param {[Role.name]} creds.roles
   * @param {GhostExpressRouter_RouteOptions} routeOptions
   */
  ensurePermitted (creds, routeOptions) {
    const assignedPermissions = _.keys(routeOptions.auth.permissions);


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