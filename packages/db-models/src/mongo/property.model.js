'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Property Schema for MongoDB
 * Source of truth for property listings
 */
const propertySchema = new Schema(
  {
    // Type and Status
    type: {
      type: String,
      enum: ['RENT', 'RESALE', 'PROJECT', 'PROJECT_UNIT'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PUBLISHED', 'REJECTED', 'EXPIRED', 'ARCHIVED'],
      default: 'DRAFT',
      required: true,
      index: true,
    },

    // Owner Information
    owner: {
      userId: { type: String, required: true, index: true },
      orgId: { type: String, index: true },
      type: {
        type: String,
        enum: ['INDIVIDUAL', 'AGENT', 'BUILDER'],
        required: true,
      },
    },

    // Basic Information
    title: { type: String, required: true, minlength: 10, maxlength: 200 },
    slug: { type: String, unique: true, sparse: true },
    description: { type: String, maxlength: 5000 },

    // Pricing
    pricing: {
      amount: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'INR' },
      priceType: {
        type: String,
        enum: ['FIXED', 'NEGOTIABLE', 'ON_REQUEST'],
        default: 'FIXED',
      },
      pricePerSqft: { type: Number, min: 0 },
      maintenanceCharges: { type: Number, min: 0 },
      maintenanceFrequency: {
        type: String,
        enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'],
      },
      securityDeposit: { type: Number, min: 0 },
      depositMonths: { type: Number, min: 0 },
      brokerage: { type: Number, min: 0 },
      negotiable: { type: Boolean, default: false },
    },

    // Property Attributes
    attributes: {
      propertyType: { type: String, required: true }, // Apartment, Villa, Plot, etc.
      subType: String,
      bedrooms: { type: Number, min: 0, max: 20 },
      bathrooms: { type: Number, min: 0, max: 20 },
      balconies: { type: Number, min: 0, max: 10 },
      floorNumber: { type: Number, min: -5, max: 200 },
      totalFloors: { type: Number, min: 1, max: 200 },
      carpetArea: { type: Number, min: 0 },
      builtUpArea: { type: Number, min: 0 },
      superBuiltUpArea: { type: Number, min: 0 },
      plotArea: { type: Number, min: 0 },
      areaUnit: {
        type: String,
        enum: ['SQFT', 'SQMT', 'SQYD', 'ACRE', 'HECTARE'],
        default: 'SQFT',
      },
      facing: String,
      ageOfProperty: { type: Number, min: 0 },
      possessionStatus: {
        type: String,
        enum: ['READY', 'UNDER_CONSTRUCTION'],
      },
      possessionDate: Date,
      furnishing: {
        type: String,
        enum: ['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'],
      },
      flooring: String,
      parking: {
        covered: { type: Number, default: 0 },
        open: { type: Number, default: 0 },
      },
      waterSupply: String,
      powerBackup: String,
      amenities: [String],
      features: [String],
      nearbyPlaces: [
        {
          type: String,
          name: String,
          distance: Number,
        },
      ],
    },

    // Location
    location: {
      address: String,
      landmark: String,
      locality: String,
      localityId: { type: String, index: true },
      city: String,
      cityId: { type: String, index: true },
      state: String,
      stateId: String,
      country: { type: String, default: 'India' },
      pincode: String,
      geo: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number], // [longitude, latitude]
      },
    },

    // Media
    media: {
      images: [
        {
          mediaId: String,
          url: String,
          thumbnailUrl: String,
          webpUrl: String,
          alt: String,
          order: { type: Number, default: 0 },
          isPrimary: { type: Boolean, default: false },
          tags: [String],
        },
      ],
      videos: [
        {
          mediaId: String,
          url: String,
          thumbnailUrl: String,
          duration: Number,
        },
      ],
      floorPlans: [
        {
          mediaId: String,
          url: String,
          label: String,
        },
      ],
      documents: [
        {
          mediaId: String,
          url: String,
          type: String,
          name: String,
        },
      ],
      virtualTour: String,
      brochureUrl: String,
    },

    // Premium/Boost
    premium: {
      tier: {
        type: String,
        enum: ['NONE', 'FEATURED', 'PREMIUM', 'SPOTLIGHT'],
        default: 'NONE',
      },
      activeUntil: Date,
      boostCount: { type: Number, default: 0 },
      lastBoostedAt: Date,
      subscriptionId: String,
    },

    // Moderation
    moderation: {
      autoScore: { type: Number, min: 0, max: 100 },
      qualityScore: { type: Number, min: 0, max: 100 },
      manualReviewRequired: { type: Boolean, default: false },
      taskId: String,
      reviewerId: String,
      reviewNotes: String,
      rejectionReason: String,
      rejectionDetails: [String],
      flags: [String],
    },

    // Metrics
    metrics: {
      views: { type: Number, default: 0 },
      uniqueViews: { type: Number, default: 0 },
      shortlists: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      inquiries: { type: Number, default: 0 },
      phoneReveals: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
    },

    // SEO
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
      canonicalUrl: String,
    },

    // Contact Preferences
    contact: {
      showPhone: { type: Boolean, default: true },
      maskedPhone: String,
      showEmail: { type: Boolean, default: false },
      preferredContactTime: String,
      whatsappEnabled: { type: Boolean, default: false },
    },

    // Verification
    verification: {
      ownershipVerified: { type: Boolean, default: false },
      reraVerified: { type: Boolean, default: false },
      reraNumber: String,
      physicallyVerified: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBy: String,
    },

    // Versioning
    version: { type: Number, default: 1 },

    // Timestamps
    publishedAt: Date,
    expiresAt: Date,
    lastRefreshedAt: Date,
    soldAt: Date,
    rentedAt: Date,
  },
  {
    timestamps: true,
    collection: 'properties',
  }
);

// Indexes
propertySchema.index({ status: 1, 'location.cityId': 1, 'location.localityId': 1 });
propertySchema.index({ 'location.geo': '2dsphere' });
propertySchema.index({ 'owner.userId': 1, status: 1 });
propertySchema.index({ 'owner.orgId': 1, status: 1 });
propertySchema.index({ 'premium.tier': 1, 'premium.activeUntil': 1 });
propertySchema.index({ type: 1, status: 1, 'attributes.propertyType': 1 });
propertySchema.index({ updatedAt: -1 });
propertySchema.index({ expiresAt: 1 });
propertySchema.index({ createdAt: -1 });

// Virtual for ID
propertySchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON
propertySchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const PropertyModel = mongoose.model('Property', propertySchema);

module.exports = PropertyModel;
