"use strict";

/**
 * @name Role
 * @type {Object}
 * @property {Number} id
 * @property {String} name
 * @property {Date} updatedAt
 * @property {Date} createdAt
 */

module.exports = function(sequelize, DataTypes) {
  const Role = sequelize.define("role", {
    name: {
      primaryKey: true,
      type: DataTypes.STRING
    }
  }, {
    classMethods: {
      associate: function(models) {
        Role.belongsToMany(models.permission, {
          through: models.rolePermission,
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          constraints: true
        });
      }
    }
  });
  return Role;
};