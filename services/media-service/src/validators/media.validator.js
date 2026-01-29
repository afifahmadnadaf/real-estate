'use strict';

const { validate } = require('@real-estate/common');
const Joi = require('joi');

// Presigned URL request schema
const presignSchema = Joi.object({
  filename: Joi.string().required(),
  mimeType: Joi.string().required(),
  size: Joi.number().integer().min(1).required(),
  purpose: Joi.string().valid('general', 'property', 'org', 'user').default('general'),
});

// Complete upload schema
const completeUploadSchema = Joi.object({
  mediaId: Joi.string().required(),
});

// ID parameter schema
const idParamSchema = Joi.object({
  id: Joi.string().required(),
});

// List media query schema
const listMediaSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'PROCESSING', 'READY', 'FAILED').optional(),
  mimeType: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'size').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// Usage tracking schema
const usageSchema = Joi.object({
  entityType: Joi.string().valid('PROPERTY', 'PROJECT', 'ORGANIZATION', 'USER').required(),
  entityId: Joi.string().required(),
});

// Override moderation schema
const overrideModerationSchema = Joi.object({
  override: Joi.boolean().required(),
  reason: Joi.string().max(500).optional(),
});

module.exports = {
  validatePresign: validate(presignSchema),
  validateCompleteUpload: validate(completeUploadSchema),
  validateIdParam: validate(idParamSchema, 'params'),
  validateListMedia: validate(listMediaSchema, 'query'),
  validateUsage: validate(usageSchema),
  validateOverrideModeration: validate(overrideModerationSchema),
};
