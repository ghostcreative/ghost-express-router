const Promise = require('bluebird');
const Chance = require('chance').Chance();
const Jwt = require('jwt-simple');
const Config = require('config');
const Bcrypt = require('bcryptjs');
const Moment = require('moment');
const _ = require('lodash');

const GhostSequelize = require('ghost-sequelize');
const Db = new GhostSequelize(Config.get("server.sequelize")).getDb();

class DbSetup {

  static getDb () { return Db; }

  static dropTable (tableName, options) {
    return Db[tableName].drop(options);
  }

  /**
   * @param {String} userId
   * @returns {String}
   */
  static generateTokenFromUserIdAndRole (userId, role) {
    return Jwt.encode({ user: userId, role: role, expires: Moment().add(4, 'days') }, Config.get("server.auth.authSecret"))
  }

  static generateExpiredTokenFromUserIdAndRole (userId, role) {
    return Jwt.encode({ user: userId, role: role, expires: Moment().subtract(2, 'days') }, Config.get("server.auth.authSecret"))
  }

  static generateTokenFromProfileId (profileId) {
    return Db.user.findOne({ where: { profileId: profileId } })
    .then(user => this.generateTokenFromUserIdAndRoleAndRole(user.id, user.role))
  }

  static truncateTables (tableNames) {
    return Promise.mapSeries(tableNames, (tableName) => this.truncateTable(tableName))
  }

  static truncateTable (tableName) {
    return Db[tableName].destroy({ where: {} });
  }

  static syncAll () {
    return Db.sequelize.sync();
  }

  static syncTable (tableName, options) {
    return Db[tableName].sync(options);
  }

  static setupEntireAccount (data = {}) {
    const seedData = {};

    return DbSetup.setupProfile(data)
    .tap(profile => {
      seedData.profile = profile;
      data.email = profile.email;
      data.profileId = profile.id;
    })
    .then(() => DbSetup.setupUser(data))
    .tap(user => {
      seedData.user = user;
      data.userId = user.id;
    })
    .then(() => this.setupRole(data))
    .tap(role => seedData.userRole = role)
    .then(() => this.generateTokenFromUserIdAndRole(seedData.user.id, seedData.userRole.name))
    .tap(bearerTkn => seedData.bearerTkn = bearerTkn)
    .then(() => seedData);
  }

  static setupEntireAccountWithExpiredToken (data = {}) {
    const seedData = {};

    return DbSetup.setupProfile(data)
    .tap(profile => {
      seedData.profile = profile;
      data.email = profile.email;
      data.profileId = profile.id;
    })
    .then(() => DbSetup.setupUser(data))
    .tap(user => {
      seedData.user = user;
      data.userId = user.id;
    })
    .then(() => this.setupRole(data))
    .tap(role => seedData.userRole = role)
    .then(() => this.generateExpiredTokenFromUserIdAndRole(seedData.user.id, seedData.userRole.name))
    .tap(bearerTkn => seedData.bearerTkn = bearerTkn)
    .then(() => seedData);
  }

  /**
   * @param {Role} data
   * @return {Promise.<Role>}
   */
  static setupRole (data = {}) {
    return Db.role.create(_.defaults(data, {
      name: Chance.word()
    }));
  }

  /**
   * @param {Permission} data
   * @return {Promise.<Permission>}
   */
  static setupPermission (data = {}) {
    return Db.permission.create(_.defaults(data, {
      name: Chance.word(),
      access: 'full'
    }));
  }

  /**
   * @param {RolePermission} data
   * @return {Promise.<RolePermission>}
   */
  static setupRolePermission (data = {}) {
    return Db.rolePermission.create(data);
  }

  /**
   * @param {UserRole} data
   * @return {Promise.<UserRole>}
   */
  static setupUserRole (data = {}) {
    return Db.userRole.create(data);
  }

  /**
   * @param {UserPermission} data
   * @return {Promise.<UserPermission>}
   */
  static setupUserPermission (data = {}) {
    return Db.userPermission.create(data);
  }

  /**
   * @param {Profile} data
   * @returns {Promise<Profile,err>}
   */
  static setupProfile (data = {}) {
    return Db.profile.create({
      email: data.email || Chance.email(),
      name: data.name || Chance.name(),
      phone: data.phone || Chance.phone({ formatted: false }),
      lastLoginAt: data.lastLogin || Chance.date(),
      loginCount: data.loginCount || Chance.integer({ min: 1, max: 100 }),
      lastActiveAt: data.lastActive || Chance.date(),
      profileImageUrl: data.profileImageUrl || Chance.url()
    })
  }

  /**
   * @param {ModelScope} data
   * @return {Promise.<ModelScope>}
   */
  static setupModelScope (data = {}) {
    return Db.modelScope.create(_.defaults(data, {
      name: Chance.word()
    }));
  }

  /**
   * @param {ResetToken} data
   * @returns {Promise<ResetToken,err>}
   */
  static setupResetToken (data = {}) {
    return Db.resetToken.create({
      id: Chance.guid(),
      isActive: typeof data.isActive == 'boolean' ? data.isActive : true
    })
  }

  /**
   * @param {User} data
   * @returns {Promise<User,err>}
   */
  static setupUser (data = {}) {
    return Db.user.create({
      email: data.email || Chance.email(),
      hash: data.password ? Bcrypt.hashSync(data.password, 10) : Chance.hash(),
      isActive: data.isActive || true,
      role: data.role || 'user',
      profileId: data.profileId,
      resetTokenId: data.resetTokenId
    })
  }

}

module.exports = DbSetup;