'use strict';

const EventEmitter = require('events');

jest.mock('@real-estate/common', () => {
  class AppError extends Error {
    constructor(message, statusCode, code, details = null) {
      super(message);
      this.name = 'AppError';
      this.statusCode = statusCode;
      this.code = code;
      this.details = details;
    }
  }

  const errorCodes = {
    AUTH: {
      TOKEN_EXPIRED: 'TOKEN_EXPIRED',
      TOKEN_INVALID: 'TOKEN_INVALID',
      ACCOUNT_BLOCKED: 'ACCOUNT_BLOCKED',
    },
    AUTHORIZATION: {
      INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    },
  };

  return {
    AppError,
    errorCodes,
    createLogger: () => ({ error: jest.fn() }),
  };
});

jest.mock('../config', () => ({
  jwt: { secret: 's', issuer: 'i', audience: 'a' },
  services: { admin: 'http://admin.local:3012' },
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

function mockRequestWithBody(body) {
  return jest.fn((opts, cb) => {
    const req = new EventEmitter();
    req.write = jest.fn();
    req.end = jest.fn(() => {
      const res = new EventEmitter();
      cb(res);
      process.nextTick(() => {
        if (body !== undefined) res.emit('data', body);
        res.emit('end');
      });
    });
    req.destroy = jest.fn();
    return req;
  });
}

jest.mock('http', () => ({
  request: jest.fn(),
}));

jest.mock('https', () => ({
  request: jest.fn(),
}));

const http = require('http');
const https = require('https');
const jwt = require('jsonwebtoken');
const { AppError, errorCodes } = require('@real-estate/common');

const { authMiddleware, optionalAuth, extractToken } = require('./auth');

describe('api-gateway auth middleware', () => {
  beforeEach(() => {
    jwt.verify.mockReset();
    http.request.mockReset();
    https.request.mockReset();
  });

  it('extracts token from Authorization header', () => {
    expect(extractToken({ headers: {} })).toBe(null);
    expect(extractToken({ headers: { authorization: 'Bearer abc' } })).toBe('abc');
    expect(extractToken({ headers: { authorization: 'abc' } })).toBe('abc');
  });

  it('returns 401 when token missing', async () => {
    const mw = authMiddleware();
    const req = { headers: {}, traceId: 't1' };
    const next = jest.fn();
    await mw(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe(errorCodes.AUTH.TOKEN_INVALID);
  });

  it('returns 401 when token invalid', async () => {
    jwt.verify.mockImplementation(() => {
      const e = new Error('bad');
      e.name = 'JsonWebTokenError';
      throw e;
    });
    const mw = authMiddleware();
    const req = { headers: { authorization: 'Bearer t' }, traceId: 't1' };
    const next = jest.fn();
    await mw(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe(errorCodes.AUTH.TOKEN_INVALID);
  });

  it('returns 403 when role insufficient', async () => {
    jwt.verify.mockReturnValue({ sub: 'u1', role: 'USER' });
    const mw = authMiddleware({ roles: ['ADMIN'] });
    const req = { headers: { authorization: 'Bearer t' }, traceId: 't1' };
    const next = jest.fn();
    await mw(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe(errorCodes.AUTHORIZATION.INSUFFICIENT_PERMISSIONS);
  });

  it('returns 403 when permissions denied', async () => {
    jwt.verify.mockReturnValue({ sub: 'u1', role: 'ADMIN' });
    http.request.mockImplementation(mockRequestWithBody(JSON.stringify({ allowed: false })));

    const mw = authMiddleware({ permissions: 'perm:x' });
    const req = { headers: { authorization: 'Bearer t' }, traceId: 't1' };
    const next = jest.fn();
    await mw(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe(errorCodes.AUTHORIZATION.INSUFFICIENT_PERMISSIONS);
  });

  it('allows request when permissions allowed', async () => {
    jwt.verify.mockReturnValue({ sub: 'u1', role: 'ADMIN' });
    http.request.mockImplementation(mockRequestWithBody(JSON.stringify({ allowed: true })));

    const mw = authMiddleware({ permissions: ['perm:a', 'perm:b'] });
    const req = { headers: { authorization: 'Bearer t' }, traceId: 't1' };
    const next = jest.fn();
    await mw(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user.id).toBe('u1');
  });

  it('optionalAuth sets req.user null when missing or invalid token', () => {
    const mw = optionalAuth();

    const req1 = { headers: {} };
    const next1 = jest.fn();
    mw(req1, {}, next1);
    expect(req1.user).toBe(null);
    expect(next1).toHaveBeenCalledWith();

    jwt.verify.mockImplementation(() => {
      const e = new Error('bad');
      e.name = 'JsonWebTokenError';
      throw e;
    });
    const req2 = { headers: { authorization: 'Bearer t' } };
    const next2 = jest.fn();
    mw(req2, {}, next2);
    expect(req2.user).toBe(null);
    expect(next2).toHaveBeenCalledWith();
  });
});

