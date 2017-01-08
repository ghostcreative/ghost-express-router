const AbstractRequestValidator = require('ghost-express-route-request-validator');

class AuthRouteRequestValidator extends AbstractRequestValidator {

  constructor () {
    super();
  }

  authorized (req, res, next) {
    delete req.user.hash;
    if (!req.user.status || req.user.status.toUpperCase() != 'ACTIVE') { return next(new res.Forbidden({body: 'Account is .' + req.user.status})) }

    next()
  }

  verifyResetToken (req, res, next) {
    super.validateSchema(req, res, next, {
      'id': { in: 'params', notEmpty: { errorMessage: 'Invalid reset token.' } }
    });
  }

  requestPasswordReset (req, res, next) {
    super.validateSchema(req, res, next, {
      'email': { in: 'params', isEmail: { errorMessage: 'Invalid email.' } }
    });
  }

  login (req, res, next) {
    super.validateSchema(req, res, next, {
      'email': { in: 'body', isEmail: { errorMessage: 'Invalid email.' } },
      'password': { in: 'body', notEmpty: { errorMessage: 'Missing password.' } }
    });
  }

  register (req, res, next) {
    super.validateSchema(req, res, next, {
      'email': { in: 'body', isEmail: { errorMessage: 'Invalid email.' } },
      'password': {
        in: 'body',
        notEmpty: { errorMessage: 'Missing password.' },
        containsDigit: { errorMessage: 'Password must contain at least one digit 0-9.' },
        containsSpecialCharacter: { errorMessage: 'Password must contain at least one special character.' },
        containsUpperCase: { errorMessage: 'Password must contain at least one uppercase letter A-Z.' }
      }
    })
  }

  resetPassword (req, res, next) {
    super.validateSchema(req, res, next, {
      'email': { in: 'body', isEmail: { errorMessage: 'Invalid email.' } },
      'password': {
        in: 'body',
        notEmpty: { errorMessage: 'Missing password.' },
        containsDigit: { errorMessage: 'Password must contain at least one digit 0-9.' },
        containsSpecialCharacter: { errorMessage: 'Password must contain at least one special character.' },
        containsUpperCase: { errorMessage: 'Password must contain at least one uppercase letter A-Z.' }
      },
      'token': { in: 'body', notEmpty: { errorMessage: 'Missing token.' } }
    });
  }

}

module.exports = AuthRouteRequestValidator;