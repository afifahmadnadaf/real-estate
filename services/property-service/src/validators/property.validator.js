'use strict';

const { validate } = require('@real-estate/common');
const Joi = require('joi');

// Property type enum
const propertyTypeEnum = ['RENT', 'RESALE', 'PROJECT', 'PROJECT_UNIT'];

// Property status enum
const propertyStatusEnum = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'PUBLISHED',
  'REJECTED',
  'EXPIRED',
  'ARCHIVED',
];

// Owner type enum
const _ownerTypeEnum = ['INDIVIDUAL', 'AGENT', 'BUILDER'];

// Price type enum
const priceTypeEnum = ['FIXED', 'NEGOTIABLE', 'ON_REQUEST'];

// Area unit enum
const areaUnitEnum = ['SQFT', 'SQMT', 'SQYD', 'ACRE', 'HECTARE'];

// Possession status enum
const possessionStatusEnum = ['READY', 'UNDER_CONSTRUCTION'];

// Furnishing enum
const furnishingEnum = ['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'];

// Premium tier enum
const _premiumTierEnum = ['NONE', 'FEATURED', 'PREMIUM', 'SPOTLIGHT'];

// Maintenance frequency enum
const maintenanceFrequencyEnum = ['MONTHLY', 'QUARTERLY', 'YEARLY'];

// Create property schema
const createPropertySchema = Joi.object({
  type: Joi.string()
    .valid(...propertyTypeEnum)
    .required(),
  title: Joi.string().min(10).max(200).required(),
  description: Joi.string().max(5000).allow('').optional(),
  pricing: Joi.object({
    amount: Joi.number().min(0).required(),
    currency: Joi.string().default('INR'),
    priceType: Joi.string()
      .valid(...priceTypeEnum)
      .default('FIXED'),
    pricePerSqft: Joi.number().min(0).optional(),
    maintenanceCharges: Joi.number().min(0).optional(),
    maintenanceFrequency: Joi.string()
      .valid(...maintenanceFrequencyEnum)
      .optional(),
    securityDeposit: Joi.number().min(0).optional(),
    depositMonths: Joi.number().min(0).optional(),
    brokerage: Joi.number().min(0).optional(),
    negotiable: Joi.boolean().default(false),
  }).required(),
  attributes: Joi.object({
    propertyType: Joi.string().required(),
    subType: Joi.string().optional(),
    bedrooms: Joi.number().integer().min(0).max(20).optional(),
    bathrooms: Joi.number().integer().min(0).max(20).optional(),
    balconies: Joi.number().integer().min(0).max(10).optional(),
    floorNumber: Joi.number().integer().min(-5).max(200).optional(),
    totalFloors: Joi.number().integer().min(1).max(200).optional(),
    carpetArea: Joi.number().min(0).optional(),
    builtUpArea: Joi.number().min(0).optional(),
    superBuiltUpArea: Joi.number().min(0).optional(),
    plotArea: Joi.number().min(0).optional(),
    areaUnit: Joi.string()
      .valid(...areaUnitEnum)
      .default('SQFT'),
    facing: Joi.string().optional(),
    ageOfProperty: Joi.number().min(0).optional(),
    possessionStatus: Joi.string()
      .valid(...possessionStatusEnum)
      .optional(),
    possessionDate: Joi.date().optional(),
    furnishing: Joi.string()
      .valid(...furnishingEnum)
      .optional(),
    flooring: Joi.string().optional(),
    parking: Joi.object({
      covered: Joi.number().integer().min(0).default(0),
      open: Joi.number().integer().min(0).default(0),
    }).optional(),
    waterSupply: Joi.string().optional(),
    powerBackup: Joi.string().optional(),
    amenities: Joi.array().items(Joi.string()).optional(),
    features: Joi.array().items(Joi.string()).optional(),
    nearbyPlaces: Joi.array()
      .items(
        Joi.object({
          type: Joi.string().required(),
          name: Joi.string().required(),
          distance: Joi.number().min(0).optional(),
        })
      )
      .optional(),
  }).required(),
  location: Joi.object({
    address: Joi.string().optional(),
    landmark: Joi.string().optional(),
    locality: Joi.string().optional(),
    localityId: Joi.string().optional(),
    city: Joi.string().required(),
    cityId: Joi.string().required(),
    state: Joi.string().optional(),
    stateId: Joi.string().optional(),
    country: Joi.string().default('India'),
    pincode: Joi.string().optional(),
    geo: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
    }).optional(),
  }).required(),
  contact: Joi.object({
    showPhone: Joi.boolean().default(true),
    showEmail: Joi.boolean().default(false),
    preferredContactTime: Joi.string().optional(),
    whatsappEnabled: Joi.boolean().default(false),
  }).optional(),
  orgId: Joi.string().optional(),
});

// Update property schema
const updatePropertySchema = Joi.object({
  title: Joi.string().min(10).max(200).optional(),
  description: Joi.string().max(5000).allow('').optional(),
  pricing: Joi.object({
    amount: Joi.number().min(0).optional(),
    currency: Joi.string().optional(),
    priceType: Joi.string()
      .valid(...priceTypeEnum)
      .optional(),
    pricePerSqft: Joi.number().min(0).optional(),
    maintenanceCharges: Joi.number().min(0).optional(),
    maintenanceFrequency: Joi.string()
      .valid(...maintenanceFrequencyEnum)
      .optional(),
    securityDeposit: Joi.number().min(0).optional(),
    depositMonths: Joi.number().min(0).optional(),
    brokerage: Joi.number().min(0).optional(),
    negotiable: Joi.boolean().optional(),
  }).optional(),
  attributes: Joi.object({
    propertyType: Joi.string().optional(),
    subType: Joi.string().optional(),
    bedrooms: Joi.number().integer().min(0).max(20).optional(),
    bathrooms: Joi.number().integer().min(0).max(20).optional(),
    balconies: Joi.number().integer().min(0).max(10).optional(),
    floorNumber: Joi.number().integer().min(-5).max(200).optional(),
    totalFloors: Joi.number().integer().min(1).max(200).optional(),
    carpetArea: Joi.number().min(0).optional(),
    builtUpArea: Joi.number().min(0).optional(),
    superBuiltUpArea: Joi.number().min(0).optional(),
    plotArea: Joi.number().min(0).optional(),
    areaUnit: Joi.string()
      .valid(...areaUnitEnum)
      .optional(),
    facing: Joi.string().optional(),
    ageOfProperty: Joi.number().min(0).optional(),
    possessionStatus: Joi.string()
      .valid(...possessionStatusEnum)
      .optional(),
    possessionDate: Joi.date().optional(),
    furnishing: Joi.string()
      .valid(...furnishingEnum)
      .optional(),
    flooring: Joi.string().optional(),
    parking: Joi.object({
      covered: Joi.number().integer().min(0).optional(),
      open: Joi.number().integer().min(0).optional(),
    }).optional(),
    waterSupply: Joi.string().optional(),
    powerBackup: Joi.string().optional(),
    amenities: Joi.array().items(Joi.string()).optional(),
    features: Joi.array().items(Joi.string()).optional(),
    nearbyPlaces: Joi.array()
      .items(
        Joi.object({
          type: Joi.string().required(),
          name: Joi.string().required(),
          distance: Joi.number().min(0).optional(),
        })
      )
      .optional(),
  }).optional(),
  location: Joi.object({
    address: Joi.string().optional(),
    landmark: Joi.string().optional(),
    locality: Joi.string().optional(),
    localityId: Joi.string().optional(),
    city: Joi.string().optional(),
    cityId: Joi.string().optional(),
    state: Joi.string().optional(),
    stateId: Joi.string().optional(),
    country: Joi.string().optional(),
    pincode: Joi.string().optional(),
    geo: Joi.object({
      lat: Joi.number().min(-90).max(90).optional(),
      lng: Joi.number().min(-180).max(180).optional(),
    }).optional(),
  }).optional(),
  contact: Joi.object({
    showPhone: Joi.boolean().optional(),
    showEmail: Joi.boolean().optional(),
    preferredContactTime: Joi.string().optional(),
    whatsappEnabled: Joi.boolean().optional(),
  }).optional(),
});

// Query parameters schema
const listPropertiesSchema = Joi.object({
  status: Joi.string()
    .valid(...propertyStatusEnum)
    .optional(),
  type: Joi.string()
    .valid(...propertyTypeEnum)
    .optional(),
  cityId: Joi.string().optional(),
  localityId: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'price', 'publishedAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// ID parameter schema
const idParamSchema = Joi.object({
  id: Joi.string().required(),
});

// Media ID parameter schema
const mediaIdParamSchema = Joi.object({
  id: Joi.string().required(),
  mediaId: Joi.string().required(),
});

// Document ID parameter schema
const documentIdParamSchema = Joi.object({
  id: Joi.string().required(),
  docId: Joi.string().required(),
});

// Attach media schema
const attachMediaSchema = Joi.object({
  mediaId: Joi.string().required(),
  type: Joi.string().valid('image', 'video', 'floorPlan', 'document').required(),
  order: Joi.number().integer().min(0).optional(),
  isPrimary: Joi.boolean().optional(),
  alt: Joi.string().max(200).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  label: Joi.string().max(100).optional(),
  name: Joi.string().max(200).optional(),
});

// Reorder media schema
const reorderMediaSchema = Joi.object({
  mediaIds: Joi.array().items(Joi.string()).min(1).required(),
});

// Attach document schema
const attachDocumentSchema = Joi.object({
  mediaId: Joi.string().required(),
  type: Joi.string().valid('RERA', 'OWNERSHIP', 'MAP', 'OTHER').required(),
  name: Joi.string().max(200).required(),
});

// Batch fetch schema
const batchFetchSchema = Joi.object({
  ids: Joi.array().items(Joi.string()).min(1).max(50).required(),
});

module.exports = {
  validateCreateProperty: validate(createPropertySchema),
  validateUpdateProperty: validate(updatePropertySchema),
  validateListProperties: validate(listPropertiesSchema, 'query'),
  validateIdParam: validate(idParamSchema, 'params'),
  validateMediaIdParam: validate(mediaIdParamSchema, 'params'),
  validateDocumentIdParam: validate(documentIdParamSchema, 'params'),
  validateAttachMedia: validate(attachMediaSchema),
  validateReorderMedia: validate(reorderMediaSchema),
  validateAttachDocument: validate(attachDocumentSchema),
  validateBatchFetch: validate(batchFetchSchema),
};
