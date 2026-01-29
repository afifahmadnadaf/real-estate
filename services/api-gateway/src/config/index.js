'use strict';

/**
 * API Gateway Configuration
 */
module.exports = {
  // Server
  port: parseInt(process.env.API_GATEWAY_PORT, 10) || 3000,
  env: process.env.NODE_ENV || 'development',

  // CORS
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:8080').split(','),
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_must_be_at_least_32_characters_long',
    issuer: process.env.JWT_ISSUER || 'real-estate-platform',
    audience: process.env.JWT_AUDIENCE || 'real-estate-api',
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    authMaxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS, 10) || 10,
  },

  // Redis (for rate limiting and caching)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Service URLs for proxying
  services: {
    user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    org: process.env.ORG_SERVICE_URL || 'http://localhost:3002',
    property: process.env.PROPERTY_SERVICE_URL || 'http://localhost:3003',
    search: process.env.SEARCH_SERVICE_URL || 'http://localhost:3004',
    media: process.env.MEDIA_SERVICE_URL || 'http://localhost:3005',
    lead: process.env.LEAD_SERVICE_URL || 'http://localhost:3006',
    moderation: process.env.MODERATION_SERVICE_URL || 'http://localhost:3007',
    billing: process.env.BILLING_SERVICE_URL || 'http://localhost:3008',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3009',
    geo: process.env.GEO_SERVICE_URL || 'http://localhost:3010',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3011',
    admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:3012',
    userInteractions: process.env.USER_INTERACTIONS_SERVICE_URL || 'http://localhost:3013',
  },
};
