'use strict';

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const config = require('../config');

const router = express.Router();

function normalizeServiceName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
}

function resolveServiceKey(serviceParam) {
  const normalized = normalizeServiceName(serviceParam);
  const mapping = {
    user: 'user',
    'user-service': 'user',
    org: 'org',
    'org-service': 'org',
    property: 'property',
    'property-service': 'property',
    search: 'search',
    'search-service': 'search',
    media: 'media',
    'media-service': 'media',
    lead: 'lead',
    'lead-service': 'lead',
    moderation: 'moderation',
    'moderation-service': 'moderation',
    billing: 'billing',
    'billing-service': 'billing',
    notification: 'notification',
    'notification-service': 'notification',
    geo: 'geo',
    'geo-service': 'geo',
    analytics: 'analytics',
    'analytics-service': 'analytics',
    admin: 'admin',
    'admin-service': 'admin',
    'user-interactions': 'userInteractions',
    'user-interactions-service': 'userInteractions',
    userinteractions: 'userInteractions',
  };

  return mapping[normalized] || null;
}

router.use(
  '/services/:service/:endpoint(health|ready|metrics)',
  createProxyMiddleware({
    target: 'http://127.0.0.1:1',
    changeOrigin: true,
    router: (req) => {
      const key = resolveServiceKey(req.params.service);
      const target = key ? config.services[key] : null;
      return target || 'http://127.0.0.1:1';
    },
    pathRewrite: (path, req) => `/${req.params.endpoint}`,
  })
);

module.exports = router;

