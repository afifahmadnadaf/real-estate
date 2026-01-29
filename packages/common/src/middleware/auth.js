'use strict';

const jwt = require('jsonwebtoken');

const { AppError } = require('../errors/app-error');
const errorCodes = require('../errors/error-codes');
const logger = require('../utils/logger');

/**
 * JWT configuration with defaults
 */
const defaultConfig = {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key_must_be_at_least_32_characters_long',
  issuer: process.env.JWT_ISSUER || 'real-estate-platform',
  audience: process.env.JWT_AUDIENCE || 'real-estate-api',
};

/**
 * Extract JWT token from Authorization header
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Support both "Bearer <token>" and just "<token>"
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }

  return authHeader;
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token
 * @param {Object} config - JWT configuration
 * @returns {Object} Decoded token payload
 */
function verifyToken(token, config = defaultConfig) {
  try {
    const decoded = jwt.verify(token, config.secret, {
      issuer: config.issuer,
      audience: config.audience,
    });

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token expired', 401, errorCodes.AUTH.TOKEN_EXPIRED);
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token', 401, errorCodes.AUTH.TOKEN_INVALID);
    }
    throw error;
  }
}

/**
 * Authentication middleware
 * Requires valid JWT token in Authorization header
 *
 * @param {Object} [options] - Middleware options
 * @param {Object} [options.config] - JWT configuration
 * @param {string[]} [options.roles] - Required roles (any of these)
 * @returns {import('express').RequestHandler}
 */
function authMiddleware(options = {}) {
  const { config = defaultConfig, roles = null } = options;

  return (req, res, next) => {
    try {
      const token = extractToken(req);

      if (!token) {
        throw new AppError('No token provided', 401, errorCodes.AUTH.TOKEN_INVALID);
      }

      const decoded = verifyToken(token, config);

      // Check if user is blocked
      if (decoded.status === 'BLOCKED') {
        throw new AppError('Account is blocked', 403, errorCodes.AUTH.ACCOUNT_BLOCKED);
      }

      // Check role if required
      if (roles && roles.length > 0) {
        const userRole = decoded.role;
        if (!roles.includes(userRole)) {
          throw new AppError(
            'Insufficient permissions',
            403,
            errorCodes.AUTHORIZATION.INSUFFICIENT_PERMISSIONS
          );
        }
      }

      // Attach user to request
      req.user = {
        id: decoded.sub || decoded.userId,
        email: decoded.email,
        phone: decoded.phone,
        role: decoded.role,
        orgId: decoded.orgId,
        sessionId: decoded.sessionId,
      };

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      }

      logger.error({
        type: 'auth_error',
        message: error.message,
        traceId: req.traceId,
      });

      next(new AppError('Authentication failed', 401, errorCodes.AUTH.TOKEN_INVALID));
    }
  };
}

/**
 * Optional authentication middleware
 * Does not fail if no token provided, but validates if present
 *
 * @param {Object} [options] - Middleware options
 * @returns {import('express').RequestHandler}
 */
function optionalAuth(options = {}) {
  const { config = defaultConfig } = options;

  return (req, res, next) => {
    try {
      const token = extractToken(req);

      if (!token) {
        // No token, continue without user
        req.user = null;
        return next();
      }

      const decoded = verifyToken(token, config);

      // Attach user to request
      req.user = {
        id: decoded.sub || decoded.userId,
        email: decoded.email,
        phone: decoded.phone,
        role: decoded.role,
        orgId: decoded.orgId,
        sessionId: decoded.sessionId,
      };

      next();
    } catch (error) {
      // Invalid token, continue without user
      req.user = null;
      next();
    }
  };
}

/**
 * Require specific roles middleware
 * Must be used after authMiddleware
 *
 * @param  {...string} roles - Required roles
 * @returns {import('express').RequestHandler}
 */
function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, errorCodes.AUTH.TOKEN_INVALID));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'Insufficient permissions',
          403,
          errorCodes.AUTHORIZATION.INSUFFICIENT_PERMISSIONS
        )
      );
    }

    next();
  };
}

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload
 * @param {Object} [config] - JWT configuration
 * @param {string} [expiresIn] - Token expiry
 * @returns {string}
 */
function generateAccessToken(payload, config = defaultConfig, expiresIn = '15m') {
  return jwt.sign(
    {
      ...payload,
      type: 'access',
    },
    config.secret,
    {
      expiresIn,
      issuer: config.issuer,
      audience: config.audience,
      subject: String(payload.userId || payload.sub),
    }
  );
}

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload
 * @param {Object} [config] - JWT configuration
 * @param {string} [expiresIn] - Token expiry
 * @returns {string}
 */
function generateRefreshToken(payload, config = defaultConfig, expiresIn = '30d') {
  return jwt.sign(
    {
      ...payload,
      type: 'refresh',
    },
    config.secret,
    {
      expiresIn,
      issuer: config.issuer,
      audience: config.audience,
      subject: String(payload.userId || payload.sub),
    }
  );
}

module.exports = {
  authMiddleware,
  optionalAuth,
  requireRoles,
  extractToken,
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
};
