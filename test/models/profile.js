"use strict";

/**
 * @name Profile
 * @type {Object}
 * @property {Integer} id
 * @property {String} email
 * @property {String} name
 * @property {Date} DOB
 * @property {String} TPI
 * @property {String} phone
 * @property {String} referral
 * @property {'male', 'female'} gender
 * @property {String} customerId
 * @property {String} profileImageUrl
 * @property {Date} lastLogin
 * @property {Date} lastActive
 * @property {Integer} loginCount
 * @property {Date} updatedAt
 * @property {Date} createdAt
 */

module.exports = function(sequelize, DataTypes) {
  const Profile = sequelize.define("profile", {
    email: {
      allowNull: false,
      unique: true,
      type: DataTypes.STRING
    },
    name: {
      type: DataTypes.STRING
    },
    phone: {
      type: DataTypes.STRING
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    loginCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    profileImageUrl: {
      allowNull: true,
      type: DataTypes.STRING
    }
  }, {
    scopes: {
      limited: {
        attributes: ['id', 'name', 'phone']
      }
    },
    classMethods: {
      associate: function(models) {
        Profile.hasOne(models.user, {
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          constraints: true
        });
      }
    }
  });
  return Profile;
};