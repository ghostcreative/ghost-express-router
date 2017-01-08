"use strict";
module.exports = (sequelize, DataTypes) => {

  const authorization = sequelize.define("authorization", {
    role: {
      type: DataTypes.ENUM('user', 'admin', 'guest')
    },
    remoteAddress: {
      type: DataTypes.STRING
    },
    type: {
      type: DataTypes.ENUM('registration', 'login')
    }
  }, {
    classMethods: {
      associate: function(models) {
        authorization.belongsTo(models.user);
      }
    }
  });
  return authorization;
};