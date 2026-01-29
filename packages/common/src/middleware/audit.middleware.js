'use strict';

const { prisma } = require('@real-estate/db-models');

const { createLogger } = require('./request-logger');

const logger = createLogger({ service: 'audit-middleware' });

/**
 * Audit logging middleware
 * Logs all admin actions and important operations
 */
function auditMiddleware(options = {}) {
  const {
    actions = ['POST', 'PATCH', 'PUT', 'DELETE'],
    excludePaths = ['/health', '/ready', '/metrics'],
  } = options;

  return async (req, res, next) => {
    // Skip if not an action method
    if (!actions.includes(req.method)) {
      return next();
    }

    // Skip excluded paths
    if (excludePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    // Store original end function
    const originalEnd = res.end;

    // Override end to capture response
    res.end = function (chunk, encoding) {
      // Restore original end
      res.end = originalEnd;

      // Log audit entry asynchronously (don't block response)
      logAuditEntry(req, res).catch((error) => {
        logger.error({ error }, 'Failed to log audit entry');
      });

      // Call original end
      res.end(chunk, encoding);
    };

    next();
  };
}

/**
 * Log audit entry
 */
async function logAuditEntry(req, res) {
  try {
    const userId = req.user?.id || null;
    const actorType = req.user ? (req.user.role === 'ADMIN' ? 'ADMIN' : 'USER') : 'SYSTEM';

    // Determine resource type from path
    const resourceType = getResourceType(req.path);
    const resourceId = req.params.id || req.body.id || null;

    // Determine action
    const action = getAction(req.method, req.path);

    // Get changes from request body (for updates)
    const changes = req.method === 'PATCH' || req.method === 'PUT' ? req.body : null;

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorType,
        action,
        resourceType,
        resourceId,
        changes,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
        userAgent: req.headers['user-agent'] || null,
        metadata: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error creating audit log');
  }
}

/**
 * Get resource type from path
 */
function getResourceType(path) {
  // Extract resource type from path like /v1/properties/:id -> properties
  const match = path.match(/\/v1\/([^/]+)/);
  if (match) {
    return match[1].replace(/-/g, '_').toUpperCase();
  }
  return 'UNKNOWN';
}

/**
 * Get action from method and path
 */
function getAction(method, path) {
  const methodMap = {
    POST: 'CREATE',
    PATCH: 'UPDATE',
    PUT: 'UPDATE',
    DELETE: 'DELETE',
    GET: 'READ',
  };

  const baseAction = methodMap[method] || method;

  // Add specific action based on path
  if (path.includes('/publish')) {
    return 'PUBLISH';
  }
  if (path.includes('/unpublish')) {
    return 'UNPUBLISH';
  }
  if (path.includes('/approve')) {
    return 'APPROVE';
  }
  if (path.includes('/reject')) {
    return 'REJECT';
  }
  if (path.includes('/cancel')) {
    return 'CANCEL';
  }
  if (path.includes('/assign')) {
    return 'ASSIGN';
  }
  if (path.includes('/revoke')) {
    return 'REVOKE';
  }

  return baseAction;
}

module.exports = {
  auditMiddleware,
};
