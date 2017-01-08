'use strict';
// Import route validator
const RequestValidator = require('../validators/authRouteRequestValidator');
const Validator = new RequestValidator();
const AuthRouteController = require('../controllers/authRouteController');

// Router
const Express = require('express');
const Router = Express.Router();

module.exports = (AuthService) => {
  // Import route controller
  const Controller = new AuthRouteController(AuthService);

  Router.get('/authorized', Validator.authorized, Controller.authorized);
  // Router.get('/request-password-reset/:email', Validator.requestPasswordReset, Controller.requestPasswordReset);
  // Router.get('/verify-reset-token/:id', Validator.verifyResetToken, Controller.verifyResetToken);

  Router.post('/login', Validator.login, Controller.login);
  Router.post('/register/:role', Validator.register, Controller.register);
  // Router.post('/reset-password', Validator.resetPassword, Controller.resetPassword);

  return Router;
};