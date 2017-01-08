'use strict';

const PermissionService = require('./permissionService');

class PermissionServiceFactory {

  /**
   *  @name GhostExpressPermission_PermissionServiceConfig
   *	@type {Object}
   */

  /**
   * @param {GhostExpressPermission_PermissionServiceConfig} options
   * @param {Sequelize} db
   * @return {PermissionService}
   */
  static create (options = {}, db) {
    return new PermissionService(options, db);
  }

}

module.exports = PermissionServiceFactory;