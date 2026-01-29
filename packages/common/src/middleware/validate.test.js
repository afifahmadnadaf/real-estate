'use strict';

const Joi = require('joi');
const { z } = require('zod');

const { validate } = require('./validate');
const { AppError } = require('../errors/app-error');
const errorCodes = require('../errors/error-codes');

describe('validate middleware', () => {
  it('validates Joi schema and strips unknown fields', () => {
    const schema = Joi.object({ a: Joi.string().required() });
    const mw = validate(schema);

    const req = { body: { a: 'ok', extra: 'x' } };
    const next = jest.fn();
    mw(req, {}, next);

    expect(req.body).toEqual({ a: 'ok' });
    expect(next).toHaveBeenCalledWith();
  });

  it('returns AppError with details when Joi validation fails', () => {
    const schema = Joi.object({ a: Joi.string().required() });
    const mw = validate(schema);

    const req = { body: { extra: 'x' } };
    const next = jest.fn();
    mw(req, {}, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe(errorCodes.VALIDATION.VALIDATION_ERROR);
    expect(Array.isArray(err.details)).toBe(true);
  });

  it('validates Zod schema and replaces request data with parsed output', () => {
    const schema = z.object({ a: z.string().transform((v) => v.toUpperCase()) });
    const mw = validate(schema);

    const req = { body: { a: 'ok' } };
    const next = jest.fn();
    mw(req, {}, next);

    expect(req.body).toEqual({ a: 'OK' });
    expect(next).toHaveBeenCalledWith();
  });

  it('returns AppError when Zod validation fails', () => {
    const schema = z.object({ a: z.string() });
    const mw = validate(schema);

    const req = { body: { a: 123 } };
    const next = jest.fn();
    mw(req, {}, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe(errorCodes.VALIDATION.VALIDATION_ERROR);
  });
});

