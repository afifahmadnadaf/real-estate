'use strict';

const { validate } = require('@real-estate/common');
const Joi = require('joi');

// Search query schema
const searchQuerySchema = Joi.object({
  q: Joi.string().max(200).optional(),
  type: Joi.string().valid('RENT', 'RESALE', 'PROJECT', 'PROJECT_UNIT').optional(),
  cityId: Joi.string().optional(),
  localityId: Joi.string().optional(),
  minPrice: Joi.number().integer().min(0).optional(),
  maxPrice: Joi.number().integer().min(0).optional(),
  bedrooms: Joi.number().integer().min(0).max(20).optional(),
  bathrooms: Joi.number().integer().min(0).max(20).optional(),
  propertyType: Joi.string().optional(),
  furnishing: Joi.string().valid('UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED').optional(),
  possessionStatus: Joi.string().valid('READY', 'UNDER_CONSTRUCTION').optional(),
  amenities: Joi.string().optional(),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  radius: Joi.number().min(0).max(100).optional(),
  sortBy: Joi.string().valid('relevance', 'price', 'newest').default('relevance'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  limit: Joi.number().integer().min(1).max(100).optional(),
  offset: Joi.number().integer().min(0).optional(),
});

// Map search query schema
const mapSearchQuerySchema = Joi.object({
  bounds: Joi.string().optional(),
  north: Joi.number().min(-90).max(90).optional(),
  south: Joi.number().min(-90).max(90).optional(),
  east: Joi.number().min(-180).max(180).optional(),
  west: Joi.number().min(-180).max(180).optional(),
  zoom: Joi.number().integer().min(0).max(20).optional(),
});

// Autocomplete query schema
const autocompleteQuerySchema = Joi.object({
  q: Joi.string().min(2).max(100).required(),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

// Task ID parameter schema
const taskIdParamSchema = Joi.object({
  taskId: Joi.string().required(),
});

module.exports = {
  validateSearchQuery: validate(searchQuerySchema, 'query'),
  validateMapSearchQuery: validate(mapSearchQuerySchema, 'query'),
  validateAutocompleteQuery: validate(autocompleteQuerySchema, 'query'),
  validateTaskIdParam: validate(taskIdParamSchema, 'params'),
};
