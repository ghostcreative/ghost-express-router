"use strict";

/**
 * @name RolePermission
 * @type {Object}
 * @property {Number} id
 * @property {Role.id} roleId
 * @property {Permission.id} permissionId
 * @property {Date} updatedAt
 * @property {Date} createdAt
 */

module.exports = function (sequelize, DataTypes) {
  const rolePermission = sequelize.define("rolePermission", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    }
  }, {
    classMethods: {
      associate: function (models) {
        rolePermission.belongsTo(models.role);
        rolePermission.belongsTo(models.permission);
      }
    }
  });
  return rolePermission;
};