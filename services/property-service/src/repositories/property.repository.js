'use strict';

const { AppError, ErrorCodes } = require('@real-estate/common');
const { PropertyModel } = require('@real-estate/db-models');

/**
 * Find property by ID
 */
async function findById(id) {
  const property = await PropertyModel.findById(id);
  if (!property) {
    throw new AppError('Property not found', ErrorCodes.NOT_FOUND, 404);
  }
  return property;
}

/**
 * Find property by slug
 */
async function findBySlug(slug) {
  const property = await PropertyModel.findOne({ slug });
  if (!property) {
    throw new AppError('Property not found', ErrorCodes.NOT_FOUND, 404);
  }
  return property;
}

/**
 * Create property
 */
async function create(data) {
  const property = new PropertyModel(data);
  return property.save();
}

/**
 * Update property
 */
async function update(id, data) {
  const property = await PropertyModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!property) {
    throw new AppError('Property not found', ErrorCodes.NOT_FOUND, 404);
  }
  return property;
}

/**
 * Delete property (soft delete by setting status to ARCHIVED)
 */
async function remove(id) {
  const property = await PropertyModel.findByIdAndUpdate(
    id,
    { $set: { status: 'ARCHIVED' } },
    { new: true }
  );
  if (!property) {
    throw new AppError('Property not found', ErrorCodes.NOT_FOUND, 404);
  }
  return property;
}

/**
 * List properties with filters
 */
async function list(filters = {}, options = {}) {
  const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options;

  const query = PropertyModel.find(filters);

  // Sorting
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  query.sort(sort);

  // Pagination
  query.skip(offset).limit(limit);

  const [properties, total] = await Promise.all([
    query.exec(),
    PropertyModel.countDocuments(filters),
  ]);

  return {
    properties,
    total,
    limit,
    offset,
  };
}

/**
 * Find properties by owner (user or org)
 */
async function findByOwner(ownerId, orgId = null, filters = {}, options = {}) {
  const query = { 'owner.userId': ownerId };
  if (orgId) {
    query['owner.orgId'] = orgId;
  }
  return list({ ...query, ...filters }, options);
}

/**
 * Update property status
 */
async function updateStatus(id, status, metadata = {}) {
  const updateData = { status, ...metadata };
  const property = await PropertyModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (!property) {
    throw new AppError('Property not found', ErrorCodes.NOT_FOUND, 404);
  }
  return property;
}

/**
 * Increment property metrics
 */
async function incrementMetric(id, metric, value = 1) {
  const update = {};
  update[`metrics.${metric}`] = value;
  return PropertyModel.findByIdAndUpdate(id, { $inc: update }, { new: true });
}

/**
 * Update property media
 */
async function updateMedia(id, mediaData) {
  return PropertyModel.findByIdAndUpdate(id, { $set: { media: mediaData } }, { new: true });
}

/**
 * Update property premium tier
 */
async function updatePremium(id, premiumData) {
  return PropertyModel.findByIdAndUpdate(id, { $set: { premium: premiumData } }, { new: true });
}

/**
 * Check if user owns property
 */
async function isOwner(propertyId, userId, orgId = null) {
  const property = await PropertyModel.findById(propertyId);
  if (!property) {
    return false;
  }
  if (property.owner.userId !== userId) {
    return false;
  }
  if (orgId && property.owner.orgId !== orgId) {
    return false;
  }
  return true;
}

/**
 * Find properties by query
 */
async function findByQuery(query) {
  return PropertyModel.find(query);
}

/**
 * Find properties by IDs
 */
async function findByIds(ids) {
  return PropertyModel.find({ _id: { $in: ids } });
}

module.exports = {
  findById,
  findBySlug,
  create,
  update,
  remove,
  list,
  findByOwner,
  updateStatus,
  incrementMetric,
  updateMedia,
  updatePremium,
  isOwner,
  findByQuery,
  findByIds,
};
