'use strict';
const DefaultAttachFn = require('./defaults/attachFunc');

const PermissionService = require('./permissionService');

class PermissionServiceFactory {

  /**
   *  @name GhostExpressRouter_PermissionServiceConfig
   *	@type {Object}
   *  @property {Function} attachFn
   */

  /**
   * @param {GhostExpressRouter_PermissionServiceConfig} options
   * @param {Sequelize} db
   * @return {PermissionService}
   */
  static create (options, db) {
    const attachFn = PermissionServiceFactory.resolveAttachFn(options.attachFn, db);
    return new PermissionService({ attachFn });
  }

  /**
   * @param {Function} [attachFn]
   * @param {Sequelize} [db]
   * @return {Function}
   */
  static resolveAttachFn (attachFn, db) {
    if (attachFn) return attachFn;
    if (!attachFn && !db) throw new Error('GhostExpressPermissionsError: PermissionServiceFactory.resolveAttachFn - Missing attachFn and database.');

    DefaultAttachFn.registerDb(db);
    return DefaultAttachFn;
  }

}

module.exports = PermissionServiceFactory;