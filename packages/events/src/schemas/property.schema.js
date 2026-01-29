'use strict';

const { z } = require('zod');

/**
 * Property event payload schemas
 */

// Property identifier
const propertyIdSchema = z.object({
  propertyId: z.string(),
  slug: z.string().optional(),
});

// Property created payload
const propertyCreatedSchema = propertyIdSchema.extend({
  type: z.enum(['RENT', 'RESALE', 'PROJECT', 'PROJECT_UNIT']),
  owner: z.object({
    userId: z.string(),
    orgId: z.string().optional(),
    type: z.enum(['INDIVIDUAL', 'AGENT', 'BUILDER']),
  }),
  title: z.string(),
  location: z.object({
    cityId: z.string(),
    city: z.string(),
    localityId: z.string().optional(),
    locality: z.string().optional(),
  }),
  createdAt: z.string().datetime(),
});

// Property updated payload
const propertyUpdatedSchema = propertyIdSchema.extend({
  changes: z.array(
    z.object({
      field: z.string(),
      oldValue: z.any().optional(),
      newValue: z.any(),
    })
  ),
  version: z.number().int(),
  updatedBy: z.string(),
  updatedAt: z.string().datetime(),
});

// Property status change payload
const propertyStatusChangeSchema = propertyIdSchema.extend({
  previousStatus: z.string(),
  newStatus: z.string(),
  reason: z.string().optional(),
  changedBy: z.string(),
  changedAt: z.string().datetime(),
});

// Property published payload
const propertyPublishedSchema = propertyIdSchema.extend({
  title: z.string(),
  type: z.enum(['RENT', 'RESALE', 'PROJECT', 'PROJECT_UNIT']),
  pricing: z.object({
    amount: z.number(),
    currency: z.string().default('INR'),
    pricePerSqft: z.number().optional(),
  }),
  attributes: z.object({
    propertyType: z.string(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    carpetArea: z.number().optional(),
    builtUpArea: z.number().optional(),
  }),
  location: z.object({
    cityId: z.string(),
    city: z.string(),
    localityId: z.string().optional(),
    locality: z.string().optional(),
    geo: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
  }),
  media: z.object({
    primaryImage: z.string().optional(),
    imageCount: z.number().default(0),
  }),
  premium: z
    .object({
      tier: z.enum(['NONE', 'FEATURED', 'PREMIUM', 'SPOTLIGHT']).default('NONE'),
      activeUntil: z.string().datetime().optional(),
    })
    .optional(),
  qualityScore: z.number().optional(),
  publishedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
});

// Property sold/rented payload
const propertySoldRentedSchema = propertyIdSchema.extend({
  action: z.enum(['SOLD', 'RENTED']),
  transactionDate: z.string().datetime().optional(),
  markedAt: z.string().datetime(),
  markedBy: z.string(),
});

// Property boosted payload
const propertyBoostedSchema = propertyIdSchema.extend({
  previousTier: z.enum(['NONE', 'FEATURED', 'PREMIUM', 'SPOTLIGHT']),
  newTier: z.enum(['NONE', 'FEATURED', 'PREMIUM', 'SPOTLIGHT']),
  activeUntil: z.string().datetime(),
  subscriptionId: z.string().optional(),
  boostedAt: z.string().datetime(),
});

// Property deleted payload
const propertyDeletedSchema = propertyIdSchema.extend({
  deletedBy: z.string(),
  deletedAt: z.string().datetime(),
  reason: z.string().optional(),
});

module.exports = {
  propertyIdSchema,
  propertyCreatedSchema,
  propertyUpdatedSchema,
  propertyStatusChangeSchema,
  propertyPublishedSchema,
  propertySoldRentedSchema,
  propertyBoostedSchema,
  propertyDeletedSchema,
};
