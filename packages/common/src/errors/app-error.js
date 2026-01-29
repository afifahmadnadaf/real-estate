'use strict';

const errorCodes = require('./error-codes');

/**
 * Custom application error class with support for error codes, HTTP status, and metadata
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Application error code
   * @param {Object} [details] - Additional error details
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);

    this.name = 'AppError';
    if (typeof statusCode === 'string' && typeof code === 'number') {
      this.statusCode = code;
      this.code = statusCode;
      this.details = details;
    } else {
      this.statusCode = statusCode;
      this.code = code;
      this.details = details;
    }
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }

  /**
   * Create a 400 Bad Request error
   * @param {string} message
   * @param {Object} [details]
   * @returns {AppError}
   */
  static badRequest(message = 'Bad Request', details = null) {
    return new AppError(message, 400, errorCodes.VALIDATION.VALIDATION_ERROR, details);
  }

  /**
   * Create a 401 Unauthorized error
   * @param {string} message
   * @returns {AppError}
   */
  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401, errorCodes.AUTH.TOKEN_INVALID);
  }

  /**
   * Create a 403 Forbidden error
   * @param {string} message
   * @returns {AppError}
   */
  static forbidden(message = 'Forbidden') {
    return new AppError(message, 403, errorCodes.AUTHORIZATION.FORBIDDEN);
  }

  /**
   * Create a 404 Not Found error
   * @param {string} resource
   * @returns {AppError}
   */
  static notFound(resource = 'Resource') {
    return new AppError(`${resource} not found`, 404, errorCodes.RESOURCE.NOT_FOUND);
  }

  /**
   * Create a 409 Conflict error
   * @param {string} message
   * @returns {AppError}
   */
  static conflict(message = 'Resource already exists') {
    return new AppError(message, 409, errorCodes.RESOURCE.ALREADY_EXISTS);
  }

  /**
   * Create a 422 Unprocessable Entity error
   * @param {string} message
   * @param {Object} [details]
   * @returns {AppError}
   */
  static unprocessable(message, details = null) {
    return new AppError(message, 422, errorCodes.BUSINESS.INVALID_STATE_TRANSITION, details);
  }

  /**
   * Create a 429 Too Many Requests error
   * @param {string} message
   * @param {number} [retryAfter]
   * @returns {AppError}
   */
  static tooManyRequests(message = 'Too many requests', retryAfter = 60) {
    const error = new AppError(message, 429, errorCodes.SYSTEM.RATE_LIMIT_EXCEEDED);
    error.retryAfter = retryAfter;
    return error;
  }

  /**
   * Create a 500 Internal Server Error
   * @param {string} message
   * @returns {AppError}
   */
  static internal(message = 'Internal server error') {
    return new AppError(message, 500, errorCodes.SYSTEM.INTERNAL_ERROR);
  }

  /**
   * Create a 503 Service Unavailable error
   * @param {string} message
   * @returns {AppError}
   */
  static serviceUnavailable(message = 'Service temporarily unavailable') {
    return new AppError(message, 503, errorCodes.SYSTEM.SERVICE_UNAVAILABLE);
  }
}

/**
 * Factory function to create errors with specific codes
 * @param {string} code - Error code from error-codes
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} [details] - Additional details
 * @returns {AppError}
 */
function createError(code, message, statusCode = 500, details = null) {
  return new AppError(message, statusCode, code, details);
}

module.exports = {
  AppError,
  createError,
};
