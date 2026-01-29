'use strict';

/**
 * @real-estate/common
 * Shared utilities, middleware, errors, and types for the Real Estate Platform
 */

const httpStatus = require('./constants/http-status');
const limits = require('./constants/limits');
const regex = require('./constants/regex');
const { AppError, createError } = require('./errors/app-error');
const errorCodes = require('./errors/error-codes');
const { auditMiddleware } = require('./middleware/audit.middleware');
const { authMiddleware, optionalAuth } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');
const { internalAuth } = require('./middleware/internal-auth');
const { metricsMiddleware, metricsHandler } = require('./middleware/metrics.middleware');
const { rateLimiter, createRateLimiter } = require('./middleware/rate-limiter');
const { requestLogger, createLogger } = require('./middleware/request-logger');
const { traceIdMiddleware, getTraceId } = require('./middleware/trace-id');
const { validate, validateBody, validateQuery, validateParams } = require('./middleware/validate');
const { hashPassword, comparePassword, hashToken, generateSecureToken } = require('./utils/crypto');
const { formatDate, parseDate, isExpired, addDays, addMinutes } = require('./utils/date');
const logger = require('./utils/logger');
const {
  paginate,
  parseCursor,
  createCursor,
  parsePaginationParams,
} = require('./utils/pagination');
const { formatPhone, validatePhone, maskPhone } = require('./utils/phone');
const { generateSlug, generateUniqueSlug } = require('./utils/slug');

const ErrorCodes = {
  NOT_FOUND: errorCodes.RESOURCE.NOT_FOUND,
  FORBIDDEN: errorCodes.AUTHORIZATION.FORBIDDEN,
  VALIDATION_ERROR: errorCodes.VALIDATION.VALIDATION_ERROR,
  INVALID_STATE_TRANSITION: errorCodes.BUSINESS.INVALID_STATE_TRANSITION,
  ALREADY_EXISTS: errorCodes.RESOURCE.ALREADY_EXISTS,
  SERVICE_UNAVAILABLE: errorCodes.SYSTEM.SERVICE_UNAVAILABLE,
  DATABASE_ERROR: errorCodes.SYSTEM.DATABASE_ERROR,
  CACHE_ERROR: errorCodes.SYSTEM.CACHE_ERROR,
  EXTERNAL_SERVICE_ERROR: errorCodes.SYSTEM.EXTERNAL_SERVICE_ERROR,
  TIMEOUT: errorCodes.SYSTEM.TIMEOUT,
  RATE_LIMIT_EXCEEDED: errorCodes.SYSTEM.RATE_LIMIT_EXCEEDED,
  INTERNAL_ERROR: errorCodes.SYSTEM.INTERNAL_ERROR,
};

const authenticate = authMiddleware();

module.exports = {
  // Errors
  AppError,
  createError,
  errorCodes,
  ErrorCodes,

  // Middleware
  errorHandler,
  notFoundHandler,
  requestLogger,
  createLogger,
  traceIdMiddleware,
  getTraceId,
  validate,
  validateBody,
  validateQuery,
  validateParams,
  authMiddleware,
  optionalAuth,
  authenticate,
  rateLimiter,
  createRateLimiter,
  auditMiddleware,
  internalAuth,
  metricsMiddleware,
  metricsHandler,

  // Utils
  hashPassword,
  comparePassword,
  hashToken,
  generateSecureToken,
  formatDate,
  parseDate,
  isExpired,
  addDays,
  addMinutes,
  generateSlug,
  generateUniqueSlug,
  formatPhone,
  validatePhone,
  maskPhone,
  paginate,
  parseCursor,
  createCursor,
  parsePaginationParams,
  logger,

  // Constants
  httpStatus,
  regex,
  limits,
};
