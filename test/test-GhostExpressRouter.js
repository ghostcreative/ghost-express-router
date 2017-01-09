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

const dbSetup = require('./helpers/dbSetup');
const Db = dbSetup.getDb();

const GhostExpressRouter = require('../index');
const Router = new GhostExpressRouter(Config.get('router'), Db);


let request;
let server;
let seed;

const nextyNext = (req, res, next) => {
  next();
};

const routeHandler200 = (req, res) => {
  res.sendStatus(200);
};

const routeHandler202 = (req, res) => {
  res.sendStatus(202);
};

describe('GhostExpressRouter', function () {

  before(() => {

    Router.handle('GET', '/', {
      'profileLimitedReadOnlyAccess': [nextyNext, routeHandler200],
      'profileFullAccess': routeHandler202
    });

    Router.handle('PUT', '/', routeHandler200);

    Router.handle('POST', '/', {
      'profileFullAccess': routeHandler200
    });

    return Promise.resolve()
    .then(() => GhostExpressServer.create(Config.get('server')))
    .then(_server_ => server = _server_)
    .then(() => server.useRouter('/profile', Router.getRouter()))
    .then(() => server.useMiddleware('*', Router.ErrorHandler))
    .then(() => dbSetup.syncAll())
    .then(() => dbSetup.setupEntireAccount({ email: 'seed@gmail.com', password: 'secure123$' }))
    .tap(_seed_ => seed = _seed_)
    .then(() => dbSetup.setupModelScope({ name: 'limited', model: 'profile' }))
    .tap(scope => seed.modelScope = scope)
    .then(() => dbSetup.setupRole({ name: 'user' }))
    .tap(role => seed.role = role)
    .then(() => dbSetup.setupUserRole({ userId: seed.user.id, roleName: seed.role.name }))
    .tap(userRole => seed.userRole = userRole)
    .then(() => dbSetup.setupPermission({ name: 'profileLimitedReadOnlyAccess', access: 'readOnly', modelScopeName: seed.modelScope.name }))
    .tap(permission => seed.permission = permission)
    .then(() => dbSetup.setupRolePermission({ roleName: seed.role.name, permissionName: seed.permission.name }))
    .tap(rolePermission => seed.rolePermission = rolePermission)

  });


  describe('handle', () => {

    beforeEach(() => {
      return Promise.resolve()
      .then(() => server.start())
      .then(() => request = Supertest(server.getServerInstance()))
    });

    afterEach(() => server.stop());

    it('should return a 401 Unauthorized when a bearerTkn is not provided', () => {
      return request.get('/profile')
      .expect(401)
      .expect(res => {
        expect(res.body.message).to.be.equal('Missing authorization token.');
      })
    });

    it('should allow to define router with routeOptions and properly validate GET & POST requests', () => {
      return request.get('/profile')
      .set('Authorization', `Bearer ${seed.bearerTkn}`)
      .expect(200)

    });

    it('should return 403 Forbidden when attempting to access a route without permission', () => {
      return request.post('/profile')
      .set('Authorization', `Bearer ${seed.bearerTkn}`)
      .expect(403)
    });

    it('should allow normal callbacks to be passed in place of routeOptions', () => {
      return request.put('/profile')
      .set('Authorization', `Bearer ${seed.bearerTkn}`)
      .expect(200)
    });

  });

});