"use strict";

/**
 * @name UserPermission
 * @type {Object}
 * @property {Number} id
 * @property {User.id} userId
 * @property {Permission.id} permissionId
 * @property {Date} updatedAt
 * @property {Date} createdAt
 */

module.exports = function (sequelize, DataTypes) {
  const userPermission = sequelize.define("userPermission", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    }
  }, {
    classMethods: {
      associate: function (models) {
        userPermission.belongsTo(models.user);
        userPermission.belongsTo(models.permission);
      }
    }
  });
  return userPermission;
};