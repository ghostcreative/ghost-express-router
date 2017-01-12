"use strict";

/**
 * @name Permission
 * @type {Object}
 * @property {Number} id
 * @property {String} name
 * @property {String} modelScopeName
 * @property {'full'|'readOnly'} access
 * @property {Date} updatedAt
 * @property {Date} createdAt
 */

module.exports = function(sequelize, DataTypes) {
  const Permission = sequelize.define("permission", {
    name: {
      primaryKey: true,
      type: DataTypes.STRING
    },
    access: {
      allowNull: false,
      type: DataTypes.ENUM('full', 'readOnly')
    }
  }, {
    classMethods: {
      associate: function(models) {
        Permission.belongsTo(models.modelScope);
        Permission.belongsToMany(models.user, { through: models.userPermission });
        Permission.belongsToMany(models.role, { through: models.rolePermission });
        Permission.hasMany(models.userPermission);
        Permission.hasMany(models.rolePermission);
      }
    }
  });
  return Permission;
};