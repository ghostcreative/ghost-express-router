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

const routeHandler = (req, res, next) => {
  res.sendStatus(200);
};

Router.handle('GET', '/', {
  'profileLimitedReadOnlyAccess': routeHandler,
  'profileFullAccess': routeHandler
});

Router.handle('POST', '/', {
  'profileFullAccess': routeHandler
});
      server.useRouter('/profile', Router.getRouter());

describe('GhostExpressRouter', function () {

  before(() => {
    return Promise.resolve()
    .then(() => GhostExpressServer.create(Config.get('server')))
    .then(_server_ => server = _server_)
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

    after(() => server.stop());

    it('should allow to define router with routeOptions and properly validate GET & POST requests', () => {

      return Promise.resolve()
      .then(() => server.start())
      .then(() => request = Supertest(server.getServerInstance()))
      .then(() => {
        return request.get('/profile')
        .set('Authorization', `Bearer ${seed.bearerTkn}`)
        .expect(200)
      })

    })

  });

});