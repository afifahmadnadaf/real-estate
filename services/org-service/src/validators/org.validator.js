'use strict';

const Joi = require('joi');

/**
 * Create organization schema
 */
const createOrgSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  type: Joi.string().valid('AGENT_FIRM', 'BUILDER', 'INDIVIDUAL_AGENT').required(),
  description: Joi.string().max(2000).optional(),
  website: Joi.string().uri().optional().allow(null, ''),
  contactEmail: Joi.string().email().optional(),
  contactPhone: Joi.string().optional(),
  address: Joi.object({
    line1: Joi.string(),
    line2: Joi.string().allow(''),
    city: Joi.string(),
    state: Joi.string(),
    pincode: Joi.string(),
    country: Joi.string().default('India'),
  }).optional(),
  reraNumbers: Joi.array().items(Joi.string()).optional(),
  gstNumber: Joi.string().optional().allow(null, ''),
  panNumber: Joi.string().optional().allow(null, ''),
  establishedYear: Joi.number().min(1900).max(new Date().getFullYear()).optional(),
  employeeCount: Joi.number().min(1).optional(),
});

/**
 * Update organization schema
 */
const updateOrgSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  description: Joi.string().max(2000).optional().allow(null, ''),
  website: Joi.string().uri().optional().allow(null, ''),
  contactEmail: Joi.string().email().optional(),
  contactPhone: Joi.string().optional(),
  address: Joi.object({
    line1: Joi.string(),
    line2: Joi.string().allow(''),
    city: Joi.string(),
    state: Joi.string(),
    pincode: Joi.string(),
    country: Joi.string(),
  }).optional(),
  reraNumbers: Joi.array().items(Joi.string()).optional(),
  gstNumber: Joi.string().optional().allow(null, ''),
  panNumber: Joi.string().optional().allow(null, ''),
  establishedYear: Joi.number().min(1900).max(new Date().getFullYear()).optional(),
  employeeCount: Joi.number().min(1).optional(),
});

/**
 * Request changes schema
 */
const requestChangesSchema = Joi.object({
  changes: Joi.array()
    .items(
      Joi.object({
        field: Joi.string().required(),
        message: Joi.string().required(),
      })
    )
    .min(1)
    .required(),
});

/**
 * Upload logo schema
 */
const uploadLogoSchema = Joi.object({
  mediaId: Joi.string().required(),
});

module.exports = {
  createOrgSchema,
  updateOrgSchema,
  requestChangesSchema,
  uploadLogoSchema,
};
