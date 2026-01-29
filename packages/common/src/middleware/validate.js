'use strict';

const { AppError } = require('../errors/app-error');
const errorCodes = require('../errors/error-codes');

/**
 * Generic validation middleware factory
 * Supports both Joi and Zod schemas
 *
 * @param {Object} schema - Joi or Zod schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {import('express').RequestHandler}
 */
function validate(schema, property = 'body') {
  return (req, res, next) => {
    const data = req[property];

    // Check if it's a Zod schema (has safeParse method)
    if (typeof schema.safeParse === 'function') {
      const result = schema.safeParse(data);

      if (!result.success) {
        const details = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return next(
          new AppError('Validation failed', 400, errorCodes.VALIDATION.VALIDATION_ERROR, details)
        );
      }

      // Replace request data with parsed/transformed data
      req[property] = result.data;
      return next();
    }

    // Check if it's a Joi schema (has validate method)
    if (typeof schema.validate === 'function') {
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const details = error.details.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          type: err.type,
        }));

        return next(
          new AppError('Validation failed', 400, errorCodes.VALIDATION.VALIDATION_ERROR, details)
        );
      }

      // Replace request data with validated/transformed data
      req[property] = value;
      return next();
    }

    // Unknown schema type
    return next(new Error('Invalid validation schema'));
  };
}

/**
 * Validate request body
 * @param {Object} schema - Joi or Zod schema
 * @returns {import('express').RequestHandler}
 */
function validateBody(schema) {
  return validate(schema, 'body');
}

/**
 * Validate query parameters
 * @param {Object} schema - Joi or Zod schema
 * @returns {import('express').RequestHandler}
 */
function validateQuery(schema) {
  return validate(schema, 'query');
}

/**
 * Validate URL parameters
 * @param {Object} schema - Joi or Zod schema
 * @returns {import('express').RequestHandler}
 */
function validateParams(schema) {
  return validate(schema, 'params');
}

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
};
