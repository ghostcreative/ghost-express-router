"use strict";

/**
 * @name ModelScope
 * @type {Object}
 * @property {String} name
 * @property {String} model
 * @property {Date} updatedAt
 * @property {Date} createdAt
 */

module.exports = function(sequelize, DataTypes) {
  const ModelScope = sequelize.define("modelScope", {
    name: {
      primaryKey: true,
      type: DataTypes.STRING
    },
    model: {
      allowNull: false,
      type: DataTypes.STRING
    }
  }, {
    classMethods: {
      associate: function(models) {
        ModelScope.hasMany(models.permission);
      }
    }
  });
  return ModelScope;
};