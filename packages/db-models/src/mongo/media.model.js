'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Media Schema for MongoDB
 * Stores metadata for uploaded files
 */
const mediaSchema = new Schema(
  {
    // Owner
    userId: { type: String, required: true, index: true },
    orgId: { type: String, index: true },

    // Storage
    originalKey: { type: String, required: true },
    bucket: { type: String, required: true },

    // File Info
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }, // in bytes

    // Dimensions (for images/videos)
    dimensions: {
      width: Number,
      height: Number,
    },

    // Derivatives (different sizes/formats)
    derivatives: [
      {
        size: {
          type: String,
          enum: ['thumbnail', 'small', 'medium', 'large', 'original', 'webp'],
        },
        key: String,
        url: String,
        width: Number,
        height: Number,
        format: String,
      },
    ],

    // Processing Status
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'READY', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    processingError: String,

    // Metadata
    metadata: {
      exifStripped: { type: Boolean, default: false },
      contentModeration: {
        status: {
          type: String,
          enum: ['PENDING', 'SAFE', 'FLAGGED', 'BLOCKED'],
        },
        flags: [String],
        score: Number,
      },
      duration: Number, // For videos
      blurhash: String, // Placeholder hash
    },

    // Usage tracking
    usages: [
      {
        entityType: {
          type: String,
          enum: ['PROPERTY', 'PROJECT', 'ORGANIZATION', 'USER'],
        },
        entityId: String,
      },
    ],

    // Timestamps
    processedAt: Date,
  },
  {
    timestamps: true,
    collection: 'media',
  }
);

// Indexes
mediaSchema.index({ userId: 1, createdAt: -1 });
mediaSchema.index({ orgId: 1, createdAt: -1 });
mediaSchema.index({ 'usages.entityType': 1, 'usages.entityId': 1 });

// Virtual for ID
mediaSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Get primary URL
mediaSchema.virtual('url').get(function () {
  const original = this.derivatives?.find((d) => d.size === 'original');
  return original?.url || null;
});

// Get thumbnail URL
mediaSchema.virtual('thumbnailUrl').get(function () {
  const thumbnail = this.derivatives?.find((d) => d.size === 'thumbnail');
  return thumbnail?.url || this.url;
});

mediaSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const MediaModel = mongoose.model('Media', mediaSchema);

module.exports = MediaModel;
