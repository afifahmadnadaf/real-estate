'use strict';

const { PropertyVersionModel } = require('@real-estate/db-models');

/**
 * Create a version snapshot of a property
 */
async function createVersion(propertyId, snapshot, actor, reason = '') {
  // Get current version number
  const latestVersion = await PropertyVersionModel.findOne({ propertyId })
    .sort({ version: -1 })
    .limit(1);

  const versionNumber = latestVersion ? latestVersion.version + 1 : 1;

  // Create version record
  const version = new PropertyVersionModel({
    propertyId,
    version: versionNumber,
    snapshot,
    actor: {
      userId: actor.userId,
      type: actor.type || 'USER',
    },
    reason: reason || 'Property updated',
    createdAt: new Date(),
  });

  return version.save();
}

/**
 * Get version history for a property
 */
async function getVersionHistory(propertyId, limit = 10) {
  return PropertyVersionModel.find({ propertyId }).sort({ version: -1 }).limit(limit).exec();
}

/**
 * Get specific version
 */
async function getVersion(propertyId, version) {
  return PropertyVersionModel.findOne({ propertyId, version });
}

module.exports = {
  createVersion,
  getVersionHistory,
  getVersion,
};
