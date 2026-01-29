'use strict';

jest.mock('@real-estate/common', () => {
  function validate(schema, property = 'body') {
    return (req, res, next) => {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        return next({
          name: 'AppError',
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          details: error.details.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            type: err.type,
          })),
        });
      }
      req[property] = value;
      return next();
    };
  }

  return { validate };
});

const { validateCreateProperty } = require('./property.validator');

describe('property.validator', () => {
  it('accepts a minimal valid create property payload and applies defaults', () => {
    const req = {
      body: {
        type: 'RENT',
        title: 'abcdefghij',
        pricing: { amount: 1000 },
        attributes: { propertyType: 'Apartment' },
        location: { city: 'Bengaluru', cityId: 'c1' },
        extra: 'remove-me',
      },
    };
    const next = jest.fn();

    validateCreateProperty(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body.extra).toBeUndefined();
    expect(req.body.pricing.currency).toBe('INR');
    expect(req.body.attributes.areaUnit).toBe('SQFT');
    expect(req.body.location.country).toBe('India');
  });

  it('rejects invalid create property payload with AppError', () => {
    const req = { body: { type: 'RENT' } };
    const next = jest.fn();

    validateCreateProperty(req, {}, next);

    const err = next.mock.calls[0][0];
    expect(err && err.name).toBe('AppError');
    expect(err.statusCode).toBe(400);
    expect(typeof err.code).toBe('string');
    expect(Array.isArray(err.details)).toBe(true);
  });
});

