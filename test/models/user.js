"use strict";

/**
 * @name User
 * @type {Object}
 * @property {Number} id
 * @property {String} email
 * @property {String} hash
 * @property {'ACTIVE'|'INACTIVE'} status
 * @property {Date} updatedAt
 * @property {Date} createdAt
 */

const Bcrypt = require('bcryptjs');

module.exports = function (sequelize, DataTypes) {
  const User = sequelize.define("user", {
    email: {
      allowNull: false,
      unique: true,
      type: DataTypes.STRING
    },
    hash: {
      allowNull: false,
      type: DataTypes.STRING
    },
    status: {
      allowNull: false,
      defaultValue: 'ACTIVE',
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE')
    }
  }, {
    classMethods: {
      associate: function(models) {
        User.belongsTo(models.profile);
        User.belongsTo(models.resetToken)
      }
    },
    instanceMethods: {
      ensureValidPassword: function (password) {
        return new Promise((resolve, reject) => {
          if (Bcrypt.compareSync(password, this.hash)) { resolve(this) }
          else { reject('Invalid password.') }
        });
      }
    }
  });
  return User;
};