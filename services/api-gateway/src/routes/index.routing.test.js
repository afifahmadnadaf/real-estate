'use strict';

const express = require('express');
const request = require('supertest');

jest.mock('@real-estate/common', () => ({
  createLogger: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }),
}));

jest.mock('../config', () => ({
  services: {
    user: 'http://user',
    org: 'http://org',
    property: 'http://property',
    search: 'http://search',
    media: 'http://media',
    lead: 'http://lead',
    moderation: 'http://moderation',
    billing: 'http://billing',
    notification: 'http://notification',
    geo: 'http://geo',
    userInteractions: 'http://ui',
    analytics: 'http://analytics',
    admin: 'http://admin',
  },
}));

jest.mock('../middleware/rate-limit', () => {
  const passthrough = (req, res, next) => next();
  return {
    authRateLimiter: passthrough,
    webhookRateLimiter: passthrough,
  };
});

jest.mock('../middleware/auth', () => {
  const authMiddleware = (options = {}) => (req, res, next) => {
    req._auth = { type: 'required', options };
    req.user = { id: 'u1', role: 'ADMIN', orgId: 'o1' };
    next();
  };

  const optionalAuth = () => (req, res, next) => {
    req._auth = { type: 'optional' };
    next();
  };

  return { authMiddleware, optionalAuth };
});

jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: jest.fn((opts) => {
    const mw = (req, res) =>
      res.status(200).json({
        target: opts.target,
        pathRewrite: opts.pathRewrite || {},
        auth: req._auth || null,
        originalUrl: req.originalUrl,
      });
    mw.__proxyOptions = opts;
    return mw;
  }),
}));

jest.mock('./internal.routes', () => require('express').Router());

const { createProxyMiddleware } = require('http-proxy-middleware');

function createApp() {
  const app = express();
  const router = require('./index');
  app.use('/v1', router);
  return app;
}

describe('api-gateway routing (static, no proxying)', () => {
  beforeEach(() => {
    createProxyMiddleware.mockClear();
  });

  it('routes public GET /v1/properties via optional auth to property-service', async () => {
    const app = createApp();
    const res = await request(app).get('/v1/properties');
    expect(res.status).toBe(200);
    expect(res.body.target).toBe('http://property');
    expect(res.body.auth.type).toBe('optional');
  });

  it('routes protected POST /v1/properties via required auth to property-service', async () => {
    const app = createApp();
    const res = await request(app).post('/v1/properties');
    expect(res.status).toBe(200);
    expect(res.body.target).toBe('http://property');
    expect(res.body.auth.type).toBe('required');
  });

  it('routes public GET /v1/media/:id via optional auth to media-service', async () => {
    const app = createApp();
    const res = await request(app).get('/v1/media/m1');
    expect(res.status).toBe(200);
    expect(res.body.target).toBe('http://media');
    expect(res.body.auth.type).toBe('optional');
  });

  it('routes protected POST /v1/media via required auth to media-service', async () => {
    const app = createApp();
    const res = await request(app).post('/v1/media');
    expect(res.status).toBe(200);
    expect(res.body.target).toBe('http://media');
    expect(res.body.auth.type).toBe('required');
  });

  it('dispatches /v1/admin/search/* to search-service with rewrite', async () => {
    const app = createApp();
    const res = await request(app).get('/v1/admin/search/index/health');
    expect(res.status).toBe(200);
    expect(res.body.target).toBe('http://search');
    expect(res.body.pathRewrite).toEqual({ '^/v1/admin/search': '/v1/search/admin' });
    expect(res.body.auth.type).toBe('required');
    expect(Array.isArray(res.body.auth.options.roles)).toBe(true);
  });

  it('dispatches /v1/admin/geo/* to geo-service with rewrite', async () => {
    const app = createApp();
    const res = await request(app).get('/v1/admin/geo/cities/1');
    expect(res.status).toBe(200);
    expect(res.body.target).toBe('http://geo');
    expect(res.body.pathRewrite).toEqual({ '^/v1/admin/geo': '/v1/geo/admin' });
  });

  it('dispatches /v1/admin/media/* to media-service with rewrite', async () => {
    const app = createApp();
    const res = await request(app).get('/v1/admin/media/failed');
    expect(res.status).toBe(200);
    expect(res.body.target).toBe('http://media');
    expect(res.body.pathRewrite).toEqual({ '^/v1/admin/media': '/v1/media/admin' });
  });

  it('returns 404 JSON for unknown admin paths', async () => {
    const app = createApp();
    const res = await request(app).get('/v1/admin/unknown-domain/x');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('forwards headers in proxy options via onProxyReq', () => {
    jest.resetModules();
    const { createProxyMiddleware: freshCreateProxy } = require('http-proxy-middleware');
    const freshRouter = require('./index');
    const app = express();
    app.use('/v1', freshRouter);

    const anyCall = freshCreateProxy.mock.calls.find((c) => c[0] && c[0].target === 'http://user');
    expect(anyCall).toBeTruthy();
    const opts = anyCall[0];
    expect(typeof opts.onProxyReq).toBe('function');

    const proxyReq = { setHeader: jest.fn() };
    const req = { traceId: 'trace-1', user: { id: 'u1', role: 'ADMIN', orgId: 'o1' } };
    opts.onProxyReq(proxyReq, req);

    expect(proxyReq.setHeader).toHaveBeenCalledWith('X-Request-ID', 'trace-1');
    expect(proxyReq.setHeader).toHaveBeenCalledWith('X-User-ID', 'u1');
    expect(proxyReq.setHeader).toHaveBeenCalledWith('X-User-Role', 'ADMIN');
    expect(proxyReq.setHeader).toHaveBeenCalledWith('X-Org-ID', 'o1');
  });
});

