'use strict';

const { AppError } = require('../errors/app-error');
const errorCodes = require('../errors/error-codes.js');

function internalAuth(options = {}) {
  const { headerName = 'x-internal-token' } = options;
  const expectedToken = process.env.INTERNAL_API_TOKEN;

  return (req, res, next) => {
    const token = req.headers[headerName];
    if (!expectedToken || !token || token !== expectedToken) {
      return next(new AppError('Invalid internal token', 401, errorCodes.AUTH.TOKEN_INVALID));
    }
    next();
  };
}

module.exports = {
  internalAuth,
};
