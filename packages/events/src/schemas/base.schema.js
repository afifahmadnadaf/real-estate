'use strict';

const { z } = require('zod');

/**
 * Base event envelope schema
 * All events must conform to this structure
 */
const baseEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.string().min(1),
  occurredAt: z.string().datetime(),
  producer: z.string().min(1),
  version: z.number().int().positive().default(1),
  traceId: z.string().uuid().optional(),
  correlationId: z.string().optional(),
  payload: z.record(z.any()),
});

/**
 * Validate an event against the base schema
 * @param {Object} event - Event to validate
 * @returns {Object} Validated event
 */
function validateEvent(event) {
  return baseEventSchema.parse(event);
}

/**
 * Safely validate an event (returns result object instead of throwing)
 * @param {Object} event - Event to validate
 * @returns {{ success: boolean, data?: Object, error?: Object }}
 */
function safeValidateEvent(event) {
  return baseEventSchema.safeParse(event);
}

module.exports = {
  baseEventSchema,
  validateEvent,
  safeValidateEvent,
};
