'use strict';

const Joi = require('joi');

/**
 * Update profile schema
 */
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  avatarUrl: Joi.string().uri().optional().allow(null),
  email: Joi.string().email().optional(),
  metadata: Joi.object().optional(),
});

/**
 * Update preferences schema
 */
const updatePreferencesSchema = Joi.object({
  notificationSettings: Joi.object({
    email: Joi.boolean(),
    sms: Joi.boolean(),
    push: Joi.boolean(),
    whatsapp: Joi.boolean(),
  }).optional(),
  searchPreferences: Joi.object({
    propertyTypes: Joi.array().items(Joi.string()),
    cities: Joi.array().items(Joi.string()),
    budgetMin: Joi.number().min(0),
    budgetMax: Joi.number().min(0),
    bedrooms: Joi.array().items(Joi.number()),
  }).optional(),
  displayPreferences: Joi.object({
    currency: Joi.string().valid('INR', 'USD'),
    areaUnit: Joi.string().valid('SQFT', 'SQMT'),
    language: Joi.string().valid('en', 'hi'),
  }).optional(),
});

/**
 * Admin update user schema
 */
const adminUpdateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  role: Joi.string().valid('USER', 'AGENT', 'BUILDER', 'ADMIN').optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING_VERIFICATION').optional(),
  metadata: Joi.object().optional(),
});

module.exports = {
  updateProfileSchema,
  updatePreferencesSchema,
  adminUpdateUserSchema,
};
