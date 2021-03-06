const Chai = require('chai');
const expect = Chai.expect;
const Supertest = require('supertest-as-promised');
const Config = require('config');
const Promise = require('bluebird');
const _ = require('lodash');
const MockExpressRequest = require('mock-express-request');
const MockExpressResponse = require('mock-express-response');
const Express = require('express');
const GhostExpressServer = require('ghost-express-server');
const Joi = require('joi');

const dbSetup = require('./helpers/dbSetup');
const db = dbSetup.getDb();

const GhostLogger = require('ghost-logger');
const Logger = new GhostLogger(Config.get('server.logger'));

const GhostExpressRouter = require('../index');
const Router = new GhostExpressRouter();

const ExpressRouter = Express.Router();


let request;
let server;
let seed;

const nextyNext = (req, res, next) => {
  next();
};

const routeHandler200 = (req, res) => {
  res.sendStatus(200);
};

describe('GhostExpressRouter', function () {

  before(() => {

    Router.configure([
      {
        method: 'GET',
        path: '/',
        handler: routeHandler200
      }, {
        method: 'POST',
        path: '/',
        auth: {
          plugin: 'bearerJwt'
        },
        handler: routeHandler200
      }, {
        method: 'GET',
        path: '/restricted',
        auth: {
          plugin: 'bearerJwt',
          permissions: ['profileLimitedReadOnlyAccess', 'profileFullAccess']
        },
        handler: [nextyNext, routeHandler200]
      }, {
        method: 'GET',
        path: '/restricted/:id',
        auth: {
          plugin: 'bearerJwt',
          permissions: ['profileLimitedReadOnlyAccess', 'profileFullAccess']
        },
        handler: [nextyNext, routeHandler200],
        validate: {
          params: {
            id: Joi.number().integer()
          }
        }
      }, {
        method: 'POST',
        path: '/restricted',
        auth: {
          plugin: 'bearerJwt',
          permissions: ['profileFullAccess']
        },
        handler: routeHandler200
      }
    ]);

    Router.registerHandler('GET', '/basic', routeHandler200);

    return Promise.resolve()
    .then(() => GhostExpressServer.create(Config.get('server')))
    .then(_server_ => server = _server_)
    .then(() => server.useRouter('/test', Router))
    .then(() => dbSetup.syncAll())
    .then(() => dbSetup.setupEntireAccount({ email: 'seed@gmail.com', password: 'secure123$', role: 'user' }))
    .tap(_seed_ => seed = _seed_)
    .then(() => dbSetup.setupModelScope({ name: 'limited', model: 'profile' }))
    .tap(scope => seed.modelScope = scope)
    .then(() => dbSetup.setupRole({ name: 'admin' }))
    .tap(role => seed.adminRole = role)
    .then(() => dbSetup.setupUserRole({ userId: seed.user.id, roleName: seed.userRole.name }))
    .tap(userRole => seed.userUserRole = userRole)
    .then(() => dbSetup.setupUserRole({ userId: seed.user.id, roleName: seed.adminRole.name }))
    .tap(userRole => seed.userAdminRole = userRole)
    .then(() => dbSetup.setupPermission({ name: 'profileLimitedReadOnlyAccess', access: 'readOnly', modelScopeName: seed.modelScope.name }))
    .tap(permission => seed.readOnlyPermission = permission)
    .then(() => dbSetup.setupPermission({ name: 'profileFullAccess', access: 'full', modelScopeName: seed.modelScope.name }))
    .tap(permission => seed.fullPermission = permission)
    .then(() => dbSetup.setupRolePermission({ roleName: seed.userRole.name, permissionName: seed.readOnlyPermission.name }))
    .tap(rolePermission => seed.userRolePermission = rolePermission)
    .then(() => dbSetup.setupRolePermission({ roleName: seed.adminRole.name, permissionName: seed.fullPermission.name }))
    .tap(rolePermission => seed.adminRolePermission = rolePermission)
    .catch(err => Logger.error('test-GhostExpressRouterError', err))
  });


  describe('registerHandler', () => {

    beforeEach(() => {
      return Promise.resolve()
      .then(() => server.start())
      .then(() => request = Supertest(server.getServerInstance()))
    });

    afterEach(() => server.stop());

    it('should allow a method, path and callback to be passed in and work', () => {
      return request.get('/test/basic')
      .expect(200)
    });

  });

  describe('configure', () => {

    beforeEach(() => {
      return Promise.resolve()
      .then(() => server.start())
      .then(() => request = Supertest(server.getServerInstance()))
    });

    afterEach(() => server.stop());

    it('should return a 400 Bad Request when an invalid id is requested', () => {
      return request.get('/test/restricted/stringcheese')
      .set('Authorization', `Bearer ${seed.bearerTkn}`)
      .expect(400)
      .expect(res => {
        expect(res.body.message).to.be.equal('"id" must be a number');
      })
    });

    it('should return a 401 Unauthorized when a bearerTkn is not provided for a permissioned route', () => {
      return request.get('/test/restricted')
      .expect(401)
      .expect(res => {
        expect(res.body.message).to.be.equal('Missing authorization token.');
      })
    });

    it('should return a 401 Unauthorized when a bearerTkn is not provided for a non permissioned, but still authorized route', () => {
      return request.post('/test')
      .expect(401)
      .expect(res => {
        expect(res.body.message).to.be.equal('Missing authorization token.');
      })
    });

    it('should return 403 Forbidden when attempting to access a route without permission as by granted in the bearerTkn', () => {
      return request.post('/test/restricted')
      .set('Authorization', `Bearer ${seed.bearerTkn}`)
      .expect(403)
    });

    it('should allow to define router with routeOptions and properly validate GET & POST requests', () => {
      return request.get('/test/restricted')
      .set('Authorization', `Bearer ${seed.bearerTkn}`)
      .expect(200)

    });

    it('should allow normal callbacks to be passed in place of routeOptions', () => {
      return request.get('/test')
      .set('Authorization', `Bearer ${seed.bearerTkn}`)
      .expect(200)
    });

  });

});