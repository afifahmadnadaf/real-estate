'use strict';

const { AppError, ErrorCodes } = require('@real-estate/common');
const { MediaModel } = require('@real-estate/db-models');

/**
 * Find media by ID
 */
async function findById(id) {
  const media = await MediaModel.findById(id);
  if (!media) {
    throw new AppError('Media not found', ErrorCodes.NOT_FOUND, 404);
  }
  return media;
}

/**
 * Create media record
 */
async function create(data) {
  const media = new MediaModel(data);
  return media.save();
}

/**
 * Update media record
 */
async function update(id, data) {
  const media = await MediaModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!media) {
    throw new AppError('Media not found', ErrorCodes.NOT_FOUND, 404);
  }
  return media;
}

/**
 * Delete media record
 */
async function remove(id) {
  const media = await MediaModel.findByIdAndDelete(id);
  if (!media) {
    throw new AppError('Media not found', ErrorCodes.NOT_FOUND, 404);
  }
  return media;
}

/**
 * List media by user
 */
async function listByUser(userId, orgId = null, filters = {}, options = {}) {
  const query = { userId };
  if (orgId) {
    query.orgId = orgId;
  }

  // Apply filters
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.mimeType) {
    query.mimeType = filters.mimeType;
  }

  const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options;

  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [media, total] = await Promise.all([
    MediaModel.find(query).sort(sort).skip(offset).limit(limit).exec(),
    MediaModel.countDocuments(query),
  ]);

  return {
    media,
    total,
    limit,
    offset,
  };
}

/**
 * Add usage tracking
 */
async function addUsage(id, entityType, entityId) {
  return MediaModel.findByIdAndUpdate(
    id,
    {
      $addToSet: {
        usages: { entityType, entityId },
      },
    },
    { new: true }
  );
}

/**
 * Remove usage tracking
 */
async function removeUsage(id, entityType, entityId) {
  return MediaModel.findByIdAndUpdate(
    id,
    {
      $pull: {
        usages: { entityType, entityId },
      },
    },
    { new: true }
  );
}

/**
 * Update processing status
 */
async function updateStatus(id, status, error = null) {
  const update = { status };
  if (error) {
    update.processingError = error;
  }
  if (status === 'READY') {
    update.processedAt = new Date();
  }
  return update(id, update);
}

/**
 * Update derivatives
 */
async function updateDerivatives(id, derivatives) {
  return update(id, { derivatives });
}

/**
 * Update dimensions
 */
async function updateDimensions(id, dimensions) {
  return update(id, { dimensions });
}

/**
 * Update metadata
 */
async function updateMetadata(id, metadata) {
  return update(id, { metadata });
}

module.exports = {
  findById,
  create,
  update,
  remove,
  listByUser,
  addUsage,
  removeUsage,
  updateStatus,
  updateDerivatives,
  updateDimensions,
  updateMetadata,
};
