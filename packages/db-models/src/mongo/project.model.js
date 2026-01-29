'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Project Schema for MongoDB
 * Builder projects with multiple units
 */
const projectSchema = new Schema(
  {
    // Organization
    orgId: { type: String, required: true, index: true },

    // Basic Information
    name: { type: String, required: true, minlength: 3, maxlength: 200 },
    slug: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },

    // Overview
    overview: {
      description: { type: String, maxlength: 10000 },
      totalUnits: { type: Number, min: 0 },
      availableUnits: { type: Number, min: 0 },
      totalTowers: { type: Number, min: 1 },
      totalFloors: { type: Number, min: 1 },
      launchDate: Date,
      possessionDate: Date,
      possessionStatus: String,
      projectStatus: {
        type: String,
        enum: ['PRE_LAUNCH', 'NEW_LAUNCH', 'UNDER_CONSTRUCTION', 'READY_TO_MOVE'],
      },
      projectType: String, // Residential, Commercial, Mixed
    },

    // Configurations
    configurations: [
      {
        type: String, // 1 BHK, 2 BHK, etc.
        bedrooms: Number,
        bathrooms: Number,
        carpetArea: {
          min: Number,
          max: Number,
        },
        price: {
          min: Number,
          max: Number,
        },
        availableUnits: Number,
      },
    ],

    // Inventory units
    inventoryUnits: [
      {
        unitId: { type: String, required: true },
        title: { type: String, maxlength: 200 },
        configuration: { type: String },
        bedrooms: Number,
        bathrooms: Number,
        carpetArea: Number,
        builtUpArea: Number,
        price: Number,
        floor: Number,
        tower: String,
        status: {
          type: String,
          enum: ['AVAILABLE', 'BOOKED', 'SOLD', 'HOLD'],
          default: 'AVAILABLE',
        },
        metadata: Schema.Types.Mixed,
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],

    // Pricing
    pricing: {
      minPrice: Number,
      maxPrice: Number,
      pricePerSqft: {
        min: Number,
        max: Number,
      },
      currency: { type: String, default: 'INR' },
    },

    // Location
    location: {
      address: String,
      locality: String,
      localityId: { type: String, index: true },
      city: String,
      cityId: { type: String, index: true },
      state: String,
      pincode: String,
      geo: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number],
      },
    },

    // Amenities
    amenities: {
      internal: [String],
      external: [String],
      nearby: [
        {
          type: String,
          name: String,
          distance: Number,
        },
      ],
    },

    // Specifications
    specifications: {
      structure: String,
      flooring: String,
      fittings: String,
      electrical: String,
      doors: String,
      windows: String,
      kitchen: String,
      bathroom: String,
    },

    // Developer Info
    developer: {
      name: String,
      about: String,
      logo: String,
      website: String,
      experience: Number,
      completedProjects: Number,
    },

    // Media
    media: {
      logo: String,
      images: [
        {
          mediaId: String,
          url: String,
          tag: String,
          order: Number,
        },
      ],
      videos: [
        {
          mediaId: String,
          url: String,
          title: String,
        },
      ],
      floorPlans: [
        {
          mediaId: String,
          url: String,
          config: String,
        },
      ],
      brochureUrl: String,
      virtualTour: String,
      masterPlan: String,
    },

    // Verification
    verification: {
      reraNumbers: [
        {
          state: String,
          number: String,
          validUntil: Date,
        },
      ],
      reraVerified: { type: Boolean, default: false },
    },

    // Premium
    premium: {
      tier: {
        type: String,
        enum: ['NONE', 'FEATURED', 'PREMIUM', 'SPOTLIGHT'],
        default: 'NONE',
      },
      activeUntil: Date,
    },

    // Metrics
    metrics: {
      views: { type: Number, default: 0 },
      inquiries: { type: Number, default: 0 },
    },

    // Versioning
    version: { type: Number, default: 1 },
    publishedAt: Date,
  },
  {
    timestamps: true,
    collection: 'projects',
  }
);

// Indexes
projectSchema.index({ orgId: 1, status: 1 });
projectSchema.index({ 'location.cityId': 1 });
projectSchema.index({ 'location.geo': '2dsphere' });
projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ orgId: 1, 'inventoryUnits.unitId': 1 });

// Virtual for ID
projectSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

projectSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const ProjectModel = mongoose.model('Project', projectSchema);

module.exports = ProjectModel;
