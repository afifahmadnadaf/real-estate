'use strict';

const http = require('http');
const https = require('https');
const { URL } = require('url');

const { AppError, errorCodes, createLogger } = require('@real-estate/common');
const jwt = require('jsonwebtoken');

const config = require('../config');

const logger = createLogger({ service: 'api-gateway' });

/**
 * Extract JWT token from Authorization header
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }

  return authHeader;
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
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
 * Requires valid JWT token
 */
/**
 * Helper: call admin service internal permission check
 */
function checkPermissionWithAdmin(userId, permission) {
  return new Promise((resolve) => {
    try {
      const adminUrl = new URL(`${config.services.admin}/v1/admin/internal/permissions/check`);
      const payload = JSON.stringify({ userId, permission });
      const isHttps = adminUrl.protocol === 'https:';

      const opts = {
        hostname: adminUrl.hostname,
        port: adminUrl.port || (isHttps ? 443 : 80),
        path: adminUrl.pathname + (adminUrl.search || ''),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 2000,
      };

      const reqLib = isHttps ? https : http;

      const r = reqLib.request(opts, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data || '{}');
            resolve(Boolean(parsed.allowed));
          } catch (e) {
            resolve(false);
          }
        });
      });

      r.on('error', () => resolve(false));
      r.on('timeout', () => {
        r.destroy();
        resolve(false);
      });

      r.write(payload);
      r.end();
    } catch (err) {
      resolve(false);
    }
  });
}

function authMiddleware(options = {}) {
  const { roles = null, permissions = null } = options;

  return async (req, res, next) => {
    try {
      const token = extractToken(req);

      if (!token) {
        throw new AppError('No token provided', 401, errorCodes.AUTH.TOKEN_INVALID);
      }

      const decoded = verifyToken(token);

      // Check if user is blocked
      if (decoded.status === 'BLOCKED') {
        throw new AppError('Account is blocked', 403, errorCodes.AUTH.ACCOUNT_BLOCKED);
      }

      // Check role if required
      if (roles && roles.length > 0) {
        if (!roles.includes(decoded.role)) {
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
        status: decoded.status,
      };

      // If permissions specified, validate them via admin service
      if (permissions) {
        const perms = Array.isArray(permissions) ? permissions : [permissions];
        for (const p of perms) {
          const ok = await checkPermissionWithAdmin(req.user.id, p);
          if (!ok) {
            throw new AppError(
              'Insufficient permissions',
              403,
              errorCodes.AUTHORIZATION.INSUFFICIENT_PERMISSIONS
            );
          }
        }
      }

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
 * Does not fail if no token, but validates if present
 */
function optionalAuth() {
  return (req, res, next) => {
    try {
      const token = extractToken(req);

      if (!token) {
        req.user = null;
        return next();
      }

      const decoded = verifyToken(token);

      req.user = {
        id: decoded.sub || decoded.userId,
        email: decoded.email,
        phone: decoded.phone,
        role: decoded.role,
        orgId: decoded.orgId,
        sessionId: decoded.sessionId,
        status: decoded.status,
      };

      next();
    } catch (error) {
      // Invalid token, continue without user
      req.user = null;
      next();
    }
  };
}

module.exports = {
  authMiddleware,
  optionalAuth,
  extractToken,
  verifyToken,
};
