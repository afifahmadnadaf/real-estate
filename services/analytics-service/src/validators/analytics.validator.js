'use strict';

const { validate } = require('@real-estate/common');
const Joi = require('joi');

// Ingest event schema
const ingestEventSchema = Joi.object({
  type: Joi.string().required(),
  userId: Joi.string().optional(),
  sessionId: Joi.string().optional(),
  properties: Joi.object().optional(),
  timestamp: Joi.date().optional(),
});

// Batch ingest schema
const batchIngestSchema = Joi.object({
  events: Joi.array().items(ingestEventSchema).min(1).max(100).required(),
});

module.exports = {
  validateIngestEvent: validate(ingestEventSchema),
  validateBatchIngest: validate(batchIngestSchema),
};
