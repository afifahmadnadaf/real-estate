'use strict';

const express = require('express');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');

const config = require('../config');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { authRateLimiter, webhookRateLimiter } = require('../middleware/rate-limit');

const { createLogger } = require('@real-estate/common');

const logger = createLogger({ service: 'api-gateway' });

const internalRoutes = require('./internal.routes');

const router = express.Router();

/**
 * Create proxy middleware for a service
 */
function createServiceProxy(target, options = {}) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: options.pathRewrite || {},
    onProxyReq: (proxyReq, req) => {
      // Forward trace ID
      if (req.traceId) {
        proxyReq.setHeader('X-Request-ID', req.traceId);
      }

      // Forward user info if authenticated
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
        if (req.user.orgId) {
          proxyReq.setHeader('X-Org-ID', req.user.orgId);
        }
      }

      fixRequestBody(proxyReq, req);
    },
    onError: (err, req, res) => {
      logger.error({ error: err.message, target: options.target }, 'Proxy error');
      res.status(502).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service temporarily unavailable',
          traceId: req.traceId,
        },
      });
    },
    ...options,
  });
}

// =====================================
// Authentication Routes (User Service)
// =====================================
router.use(
  '/auth',
  authRateLimiter,
  createServiceProxy(config.services.user, {
    pathRewrite: { '^/v1/auth': '/v1/auth' },
  })
);

// =====================================
// User Routes (User Service)
// =====================================
router.use(
  '/users',
  authMiddleware(),
  createServiceProxy(config.services.user, {
    pathRewrite: { '^/v1/users': '/v1/users' },
  })
);

// =====================================
// Organization Routes (Org Service)
// =====================================
router.use(
  '/orgs',
  authMiddleware(),
  createServiceProxy(config.services.org, {
    pathRewrite: { '^/v1/orgs': '/v1/orgs' },
  })
);

// =====================================
// Property Routes (Property Service)
// =====================================
// Public property endpoints (view, search)
router.get('/properties', optionalAuth(), createServiceProxy(config.services.property));
router.get('/properties/:id', optionalAuth(), createServiceProxy(config.services.property));

// Protected property endpoints
router.use(
  '/properties',
  authMiddleware(),
  createServiceProxy(config.services.property, {
    pathRewrite: { '^/v1/properties': '/v1/properties' },
  })
);

// =====================================
// Project Routes (Property Service)
// =====================================
router.use(
  '/projects',
  authMiddleware(),
  createServiceProxy(config.services.property, {
    pathRewrite: { '^/v1/projects': '/v1/projects' },
  })
);

// =====================================
// Search Routes (Search Service)
// =====================================
router.use(
  '/search',
  optionalAuth(),
  createServiceProxy(config.services.search, {
    pathRewrite: { '^/v1/search': '/v1/search' },
  })
);

// =====================================
// Media Routes (Media Service)
// =====================================
router.get('/media/:id', optionalAuth(), createServiceProxy(config.services.media));
router.get('/media/:id/renditions', optionalAuth(), createServiceProxy(config.services.media));
router.use(
  '/media',
  authMiddleware(),
  createServiceProxy(config.services.media, {
    pathRewrite: { '^/v1/media': '/v1/media' },
  })
);

// =====================================
// Moderation Routes (Moderation Service)
// =====================================
router.use(
  '/reports',
  authMiddleware(),
  createServiceProxy(config.services.moderation, {
    pathRewrite: { '^/v1/reports': '/v1/reports' },
  })
);

router.use(
  '/reviews',
  authMiddleware(),
  createServiceProxy(config.services.moderation, {
    pathRewrite: { '^/v1/reviews': '/v1/reviews' },
  })
);

// =====================================
// Lead Routes (Lead Service)
// =====================================
router.use(
  '/leads',
  authMiddleware(),
  createServiceProxy(config.services.lead, {
    pathRewrite: { '^/v1/leads': '/v1/leads' },
  })
);

// =====================================
// Billing Routes (Billing Service)
// =====================================
router.use(
  '/packages',
  optionalAuth(),
  createServiceProxy(config.services.billing, {
    pathRewrite: { '^/v1/packages': '/v1/packages' },
  })
);

// Protected billing endpoints
router.use(
  '/subscriptions',
  authMiddleware(),
  createServiceProxy(config.services.billing, {
    pathRewrite: { '^/v1/subscriptions': '/v1/subscriptions' },
  })
);

router.use(
  '/payments',
  authMiddleware(),
  createServiceProxy(config.services.billing, {
    pathRewrite: { '^/v1/payments': '/v1/payments' },
  })
);

router.use(
  '/invoices',
  authMiddleware(),
  createServiceProxy(config.services.billing, {
    pathRewrite: { '^/v1/invoices': '/v1/invoices' },
  })
);

router.use(
  '/refunds',
  authMiddleware(),
  createServiceProxy(config.services.billing, {
    pathRewrite: { '^/v1/refunds': '/v1/refunds' },
  })
);

router.use(
  '/coupons',
  optionalAuth(),
  createServiceProxy(config.services.billing, {
    pathRewrite: { '^/v1/coupons': '/v1/coupons' },
  })
);

// Webhook endpoints (no auth, but signature verification)
// Partner webhooks should go to lead-service
router.use(
  '/webhooks/partner',
  webhookRateLimiter,
  createServiceProxy(config.services.lead, {
    pathRewrite: { '^/v1/webhooks/partner': '/v1/webhooks/partner' },
  })
);
router.use(
  '/webhooks',
  webhookRateLimiter,
  createServiceProxy(config.services.billing, {
    pathRewrite: { '^/v1/webhooks': '/v1/webhooks' },
  })
);

// =====================================
// Notification Routes (Notification Service)
// =====================================
router.use(
  '/notifications',
  authMiddleware(),
  createServiceProxy(config.services.notification, {
    pathRewrite: { '^/v1/notifications': '/v1/notifications' },
  })
);

router.use(
  '/notification-preferences',
  authMiddleware(),
  createServiceProxy(config.services.notification, {
    pathRewrite: { '^/v1/notification-preferences': '/v1/notification-preferences' },
  })
);

// =====================================
// Geo Routes (Geo Service)
// =====================================
router.use(
  '/geo',
  optionalAuth(),
  createServiceProxy(config.services.geo, {
    pathRewrite: { '^/v1/geo': '/v1/geo' },
  })
);

// =====================================
// User Interactions (Shortlists, Saved Searches)
// =====================================
router.use(
  '/shortlists',
  authMiddleware(),
  createServiceProxy(config.services.userInteractions, {
    pathRewrite: { '^/v1/shortlists': '/v1/shortlists' },
  })
);

router.use(
  '/saved-searches',
  authMiddleware(),
  createServiceProxy(config.services.userInteractions, {
    pathRewrite: { '^/v1/saved-searches': '/v1/saved-searches' },
  })
);

router.use(
  '/alerts',
  authMiddleware(),
  createServiceProxy(config.services.userInteractions, {
    pathRewrite: { '^/v1/alerts': '/v1/alerts' },
  })
);

// =====================================
// Analytics/Events (Analytics Service)
// =====================================
router.use(
  '/events',
  optionalAuth(),
  createServiceProxy(config.services.analytics, {
    pathRewrite: { '^/v1/events': '/v1/events' },
  })
);

// =====================================
// Content/SEO/Meta/Experiments (Admin Service)
// =====================================
router.use(
  '/content',
  optionalAuth(),
  createServiceProxy(config.services.admin, {
    pathRewrite: { '^/v1/content': '/v1/content' },
  })
);

router.use(
  '/seo',
  optionalAuth(),
  createServiceProxy(config.services.admin, {
    pathRewrite: { '^/v1/seo': '/v1/seo' },
  })
);

router.use(
  '/meta',
  optionalAuth(),
  createServiceProxy(config.services.admin, {
    pathRewrite: { '^/v1/meta': '/v1/meta' },
  })
);

router.use(
  '/experiments',
  optionalAuth(),
  createServiceProxy(config.services.admin, {
    pathRewrite: { '^/v1/experiments': '/v1/experiments' },
  })
);

router.use(
  '/support',
  authMiddleware(),
  createServiceProxy(config.services.admin, {
    pathRewrite: { '^/v1/support': '/v1/support' },
  })
);

// Internal APIs (gateway-hosted for cache invalidation)
router.use('/internal/v1', internalRoutes);

// =====================================
// Admin Routes
// =====================================
router.use('/admin', authMiddleware({ roles: ['ADMIN', 'SUPER_ADMIN'] }), (req, res, next) => {
  // Route to appropriate service based on path
  const path = req.path;

  if (path.startsWith('/moderation') || path.startsWith('/blacklist')) {
    return createServiceProxy(config.services.moderation)(req, res, next);
  }

  if (path.startsWith('/reports') || path.startsWith('/reviews') || path.startsWith('/fraud')) {
    return createServiceProxy(config.services.moderation)(req, res, next);
  }

  if (path.startsWith('/orgs')) {
    return createServiceProxy(config.services.org)(req, res, next);
  }

  if (path.startsWith('/audit') || path.startsWith('/system')) {
    return createServiceProxy(config.services.admin)(req, res, next);
  }

  if (
    path.startsWith('/content') ||
    path.startsWith('/meta') ||
    path.startsWith('/feature-flags') ||
    path.startsWith('/experiments') ||
    path.startsWith('/rate-limits') ||
    path.startsWith('/bot') ||
    path.startsWith('/bulk') ||
    path.startsWith('/support')
  ) {
    return createServiceProxy(config.services.admin)(req, res, next);
  }

  // Admin role management → admin service
  if (
    path.startsWith('/roles') ||
    path.startsWith('/roles/assign') ||
    path.startsWith('/roles/revoke')
  ) {
    return createServiceProxy(config.services.admin)(req, res, next);
  }

  if (path.startsWith('/permissions')) {
    return createServiceProxy(config.services.admin)(req, res, next);
  }

  if (path.startsWith('/users') && path.includes('/roles')) {
    return createServiceProxy(config.services.admin)(req, res, next);
  }

  if (path.startsWith('/users')) {
    return createServiceProxy(config.services.user)(req, res, next);
  }

  if (path.startsWith('/analytics')) {
    return createServiceProxy(config.services.analytics)(req, res, next);
  }

  if (path.startsWith('/search')) {
    return createServiceProxy(config.services.search, {
      pathRewrite: { '^/v1/admin/search': '/v1/search/admin' },
    })(req, res, next);
  }

  if (path.startsWith('/geo')) {
    return createServiceProxy(config.services.geo, {
      pathRewrite: { '^/v1/admin/geo': '/v1/geo/admin' },
    })(req, res, next);
  }

  if (path.startsWith('/packages')) {
    return createServiceProxy(config.services.billing)(req, res, next);
  }

  if (path.startsWith('/webhooks')) {
    return createServiceProxy(config.services.billing)(req, res, next);
  }

  if (path.startsWith('/notification-templates') || path.startsWith('/notifications')) {
    return createServiceProxy(config.services.notification)(req, res, next);
  }

  if (path.startsWith('/media')) {
    return createServiceProxy(config.services.media, {
      pathRewrite: { '^/v1/admin/media': '/v1/media/admin' },
    })(req, res, next);
  }

  // Default: 404
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Admin endpoint not found',
      traceId: req.traceId,
    },
  });
});

module.exports = router;
