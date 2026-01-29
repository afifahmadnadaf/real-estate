'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Property Version Schema for MongoDB
 * Stores version history for audit trail
 */
const propertyVersionSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    version: { type: Number, required: true },

    // Full snapshot at this version
    snapshot: { type: Schema.Types.Mixed, required: true },

    // Changes from previous version
    changes: [
      {
        field: String,
        oldValue: Schema.Types.Mixed,
        newValue: Schema.Types.Mixed,
      },
    ],

    // Who made the change
    actor: {
      userId: { type: String, required: true },
      type: {
        type: String,
        enum: ['USER', 'ADMIN', 'SYSTEM'],
        default: 'USER',
      },
    },

    // Reason for change
    reason: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'property_versions',
  }
);

// Compound index for efficient version lookups
propertyVersionSchema.index({ propertyId: 1, version: -1 });
propertyVersionSchema.index({ propertyId: 1, createdAt: -1 });

// Virtual for ID
propertyVersionSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

propertyVersionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const PropertyVersionModel = mongoose.model('PropertyVersion', propertyVersionSchema);

module.exports = PropertyVersionModel;
