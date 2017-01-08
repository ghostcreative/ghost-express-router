const Chai = require('chai');
const expect = Chai.expect;
const Promise = require('bluebird');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
Chai.use(sinonChai);

const _ = require('lodash');
const MockExpressRequest = require('mock-express-request');
const MockExpressResponse = require('mock-express-response');
const Config = require('config');

const dbSetup = require('../helpers/dbSetup');
const Db = dbSetup.getDb();

const AuthServiceFactory = require('../../lib/services/auth/authServiceFactory');
const service = new AuthServiceFactory(Config.get('auth'), Db);
let box, seed, expiredSeed, invalidSeed;
describe('authService', () => {

  beforeEach(() => box = sinon.sandbox.create());

  afterEach(() => box && box.restore());

  before(() => {
    return dbSetup.syncAll()
    .then(() => dbSetup.setupEntireAccount({ email: 'seed@gmail.com', password: 'secure123$' }))
    .then(_seed_ => seed = _seed_)
    .then(() => dbSetup.setupEntireAccountWithExpiredToken())
    .then(_seed_ => expiredSeed = _seed_)
    .then(() => dbSetup.setupEntireAccountWithInvalidToken())
    .then(_seed_ => invalidSeed = _seed_)
  });

  it('should exist', () => {
    expect(service).to.exist;
  });

  describe('authorized', () => {

    it('should return an error when no authorization header is set', () => {

      const request = new MockExpressRequest({ header: {} });
      const response = new MockExpressResponse({ request: request });
      const next = box.spy();
      const expectedError = new Error('Missing authorization token.');

      return service.authorized(request, response, next)
      .then(() => {
        expect(next).to.have.been.calledWith(expectedError);
      });
    });

    it('should return an error when a non bearer authorization header is set', () => {

      const request = new MockExpressRequest({ header: {} });
      // const request = new MockExpressRequest({ header: { 'Authorization': 'NotCorrect 123451' } });
      const response = new MockExpressResponse({ request: request });
      const next = box.stub();

      return service.authorized(request, response, next)
      .then(() => {
        expect(next).to.have.been.calledWith(Error('Invalid authorization header.'));
      });

    });

    it('should return an error when an authorization header is set and a token is sent through the body', () => {

    });

    it('should return an error when an authorization header is set and a token is sent as a query param', () => {

    });

    it('should validate a correct authorization header', () => {

    });

    it('should validate a token passed through the body', () => {

    });

    it('should validate a token passed as a query param', () => {

    });

  });

  describe('login', () => {

  });

  describe('register', () => {

  });

  describe('resetPassword', () => {

  });

  describe('requestPasswordReset', () => {

  });

  describe('verifyResetToken', () => {

  });

});