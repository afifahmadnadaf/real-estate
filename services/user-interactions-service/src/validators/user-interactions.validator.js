'use strict';

const { validate } = require('@real-estate/common');
const Joi = require('joi');

// ID parameter schema
const idParamSchema = Joi.object({
  id: Joi.string().required(),
});

// Add to shortlist schema
const addToShortlistSchema = Joi.object({
  propertyId: Joi.string().required(),
});

// Bulk update shortlist schema
const bulkUpdateShortlistSchema = Joi.object({
  propertyIds: Joi.array().items(Joi.string()).min(1).max(50).required(),
  action: Joi.string().valid('add', 'remove').required(),
});

// Create saved search schema
const createSavedSearchSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  filters: Joi.object().required(),
  alertEnabled: Joi.boolean().optional(),
  alertFrequency: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY').optional(),
});

// Update saved search schema
const updateSavedSearchSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  filters: Joi.object().optional(),
  alertEnabled: Joi.boolean().optional(),
  alertFrequency: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY').optional(),
});

// Create price alert schema
const createPriceAlertSchema = Joi.object({
  propertyId: Joi.string().required(),
  targetPrice: Joi.number().min(0).required(),
});

// Update price alert schema
const updatePriceAlertSchema = Joi.object({
  targetPrice: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional(),
});

module.exports = {
  validateIdParam: validate(idParamSchema, 'params'),
  validateAddToShortlist: validate(addToShortlistSchema),
  validateBulkUpdateShortlist: validate(bulkUpdateShortlistSchema),
  validateCreateSavedSearch: validate(createSavedSearchSchema),
  validateUpdateSavedSearch: validate(updateSavedSearchSchema),
  validateCreatePriceAlert: validate(createPriceAlertSchema),
  validateUpdatePriceAlert: validate(updatePriceAlertSchema),
};
