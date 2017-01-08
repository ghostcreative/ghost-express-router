"use strict";

module.exports = function (sequelize, DataTypes) {
  const resetToken = sequelize.define("resetToken", {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    isActive: {
      allowNull: false,
      defaultValue: true,
      type: DataTypes.BOOLEAN
    }
  }, {
    classMethods: {
      associate: function (models) {
      }
    }
  });
  return resetToken;
};