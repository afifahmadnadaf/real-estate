'use strict';

const { AsyncLocalStorage } = require('async_hooks');

const { v4: uuidv4 } = require('uuid');

// Async local storage for trace ID propagation
const asyncLocalStorage = new AsyncLocalStorage();

/**
 * Express middleware to inject trace ID into requests
 * Uses X-Request-ID header if provided, otherwise generates a new UUID
 *
 * @returns {import('express').RequestHandler}
 */
function traceIdMiddleware() {
  return (req, res, next) => {
    // Get existing trace ID from header or generate new one
    const traceId = req.headers['x-request-id'] || uuidv4();

    // Attach to request object
    req.traceId = traceId;

    // Set response header
    res.setHeader('X-Request-ID', traceId);

    // Run the rest of the request in async local storage context
    asyncLocalStorage.run({ traceId }, () => {
      next();
    });
  };
}

/**
 * Get the current trace ID from async local storage
 * Useful for getting trace ID in services/repositories without passing it through
 *
 * @returns {string|undefined}
 */
function getTraceId() {
  const store = asyncLocalStorage.getStore();
  return store?.traceId;
}

/**
 * Run a function with a specific trace ID context
 * Useful for background jobs or event handlers
 *
 * @param {string} traceId - The trace ID to use
 * @param {Function} fn - The function to run
 * @returns {*}
 */
function runWithTraceId(traceId, fn) {
  return asyncLocalStorage.run({ traceId }, fn);
}

module.exports = {
  traceIdMiddleware,
  getTraceId,
  runWithTraceId,
  asyncLocalStorage,
};
