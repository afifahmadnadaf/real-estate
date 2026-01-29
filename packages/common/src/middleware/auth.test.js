'use strict';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn(() => 'signed'),
}));

const jwt = require('jsonwebtoken');

const { AppError } = require('../errors/app-error');
const errorCodes = require('../errors/error-codes');

const {
  extractToken,
  verifyToken,
  authMiddleware,
  optionalAuth,
  requireRoles,
  generateAccessToken,
  generateRefreshToken,
} = require('./auth');

describe('common auth middleware', () => {
  beforeEach(() => {
    jwt.verify.mockReset();
    jwt.sign.mockClear();
  });

  it('extracts token from Authorization header', () => {
    expect(extractToken({ headers: {} })).toBe(null);
    expect(extractToken({ headers: { authorization: 'Bearer abc' } })).toBe('abc');
    expect(extractToken({ headers: { authorization: 'abc' } })).toBe('abc');
  });

  it('maps jwt errors to AppError', () => {
    jwt.verify.mockImplementation(() => {
      const e = new Error('bad');
      e.name = 'JsonWebTokenError';
      throw e;
    });

    expect(() => verifyToken('t')).toThrow(AppError);
    try {
      verifyToken('t');
    } catch (e) {
      expect(e.statusCode).toBe(401);
      expect(e.code).toBe(errorCodes.AUTH.TOKEN_INVALID);
    }
  });

  it('returns 401 when token missing', () => {
    const mw = authMiddleware();
    const req = { headers: {}, traceId: 't1' };
    const next = jest.fn();
    mw(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('returns 403 when blocked', () => {
    jwt.verify.mockReturnValue({ sub: 'u1', role: 'USER', status: 'BLOCKED' });
    const mw = authMiddleware();
    const req = { headers: { authorization: 'Bearer t' }, traceId: 't1' };
    const next = jest.fn();
    mw(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe(errorCodes.AUTH.ACCOUNT_BLOCKED);
  });

  it('returns 403 when role insufficient', () => {
    jwt.verify.mockReturnValue({ sub: 'u1', role: 'USER' });
    const mw = authMiddleware({ roles: ['ADMIN'] });
    const req = { headers: { authorization: 'Bearer t' }, traceId: 't1' };
    const next = jest.fn();
    mw(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe(errorCodes.AUTHORIZATION.INSUFFICIENT_PERMISSIONS);
  });

  it('attaches req.user when token valid', () => {
    jwt.verify.mockReturnValue({ sub: 'u1', email: 'e', phone: 'p', role: 'ADMIN', orgId: 'o1' });
    const mw = authMiddleware({ roles: ['ADMIN'] });
    const req = { headers: { authorization: 'Bearer t' }, traceId: 't1' };
    const next = jest.fn();
    mw(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({
      id: 'u1',
      email: 'e',
      phone: 'p',
      role: 'ADMIN',
      orgId: 'o1',
      sessionId: undefined,
    });
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

  it('requireRoles enforces auth and role', () => {
    const mw = requireRoles('ADMIN');

    const next1 = jest.fn();
    mw({ user: null }, {}, next1);
    expect(next1.mock.calls[0][0]).toBeInstanceOf(AppError);
    expect(next1.mock.calls[0][0].statusCode).toBe(401);

    const next2 = jest.fn();
    mw({ user: { role: 'USER' } }, {}, next2);
    expect(next2.mock.calls[0][0]).toBeInstanceOf(AppError);
    expect(next2.mock.calls[0][0].statusCode).toBe(403);

    const next3 = jest.fn();
    mw({ user: { role: 'ADMIN' } }, {}, next3);
    expect(next3).toHaveBeenCalledWith();
  });

  it('generates access and refresh tokens via jwt.sign', () => {
    const payload = { userId: 'u1', role: 'USER' };
    expect(generateAccessToken(payload)).toBe('signed');
    expect(generateRefreshToken(payload)).toBe('signed');

    const calls = jwt.sign.mock.calls;
    expect(calls[0][0].type).toBe('access');
    expect(calls[1][0].type).toBe('refresh');
    expect(calls[0][2].subject).toBe('u1');
    expect(calls[1][2].subject).toBe('u1');
  });
});

