"use strict";

/**
 * @name UserRole
 * @type {Object}
 * @property {Number} id
 * @property {Permission.id} userId
 * @property {Role.id} roleId
 * @property {Date} updatedAt
 * @property {Date} createdAt
 */

module.exports = function (sequelize, DataTypes) {
  const userRole = sequelize.define("userRole", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    }
  }, {
    classMethods: {
      associate: function (models) {
        userRole.belongsTo(models.user);
        userRole.belongsTo(models.role);
      }
    }
  });
  return userRole;
};