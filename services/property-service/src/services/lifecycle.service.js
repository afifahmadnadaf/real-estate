'use strict';

const { AppError, ErrorCodes } = require('@real-estate/common');
const { createProducer, TOPICS, EVENT_TYPES } = require('@real-estate/events');

const propertyRepository = require('../repositories/property.repository');

// Create a singleton producer instance
let eventProducer = null;

async function getProducer() {
  if (!eventProducer) {
    eventProducer = createProducer({ service: 'property-service' });
    await eventProducer.connect();
  }
  return eventProducer;
}

/**
 * Submit property for moderation
 */
async function submit(id, userId, orgId) {
  const property = await propertyRepository.findById(id);

  // Check ownership
  if (property.owner.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (orgId && property.owner.orgId !== orgId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  // Validate status transition
  if (property.status !== 'DRAFT' && property.status !== 'REJECTED') {
    throw new AppError(
      'Property can only be submitted from DRAFT or REJECTED status',
      ErrorCodes.INVALID_STATE_TRANSITION,
      400
    );
  }

  // Update status
  const updatedProperty = await propertyRepository.updateStatus(id, 'SUBMITTED', {
    'moderation.manualReviewRequired': true,
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.PROPERTY,
    EVENT_TYPES.PROPERTY.SUBMITTED,
    {
      propertyId: id,
      slug: updatedProperty.slug,
      owner: updatedProperty.owner,
      submittedAt: new Date().toISOString(),
    },
    { key: id }
  );

  return updatedProperty;
}

/**
 * Resubmit property after changes
 */
async function resubmit(id, userId, orgId) {
  const property = await propertyRepository.findById(id);

  // Check ownership
  if (property.owner.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (orgId && property.owner.orgId !== orgId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  // Only allow resubmission from REJECTED status
  if (property.status !== 'REJECTED') {
    throw new AppError(
      'Property can only be resubmitted from REJECTED status',
      ErrorCodes.INVALID_STATE_TRANSITION,
      400
    );
  }

  // Clear moderation data
  const updatedProperty = await propertyRepository.updateStatus(id, 'SUBMITTED', {
    'moderation.manualReviewRequired': true,
    'moderation.rejectionReason': null,
    'moderation.rejectionDetails': [],
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.PROPERTY,
    EVENT_TYPES.PROPERTY.SUBMITTED,
    {
      propertyId: id,
      slug: updatedProperty.slug,
      owner: updatedProperty.owner,
      submittedAt: new Date().toISOString(),
    },
    { key: id }
  );

  return updatedProperty;
}

/**
 * Publish property (admin only)
 */
async function publish(id, adminId) {
  const property = await propertyRepository.findById(id);

  if (property.status !== 'UNDER_REVIEW' && property.status !== 'SUBMITTED') {
    throw new AppError(
      'Property can only be published from UNDER_REVIEW or SUBMITTED status',
      ErrorCodes.INVALID_STATE_TRANSITION,
      400
    );
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 90); // Default 90 days

  const updatedProperty = await propertyRepository.updateStatus(id, 'PUBLISHED', {
    publishedAt: new Date(),
    expiresAt: expiryDate,
    'moderation.reviewerId': adminId,
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.PROPERTY,
    EVENT_TYPES.PROPERTY.PUBLISHED,
    {
      propertyId: id,
      slug: updatedProperty.slug,
      title: updatedProperty.title,
      type: updatedProperty.type,
      pricing: updatedProperty.pricing,
      attributes: updatedProperty.attributes,
      location: updatedProperty.location,
      media: {
        primaryImage: updatedProperty.media?.images?.[0]?.url,
        imageCount: updatedProperty.media?.images?.length || 0,
      },
      premium: updatedProperty.premium,
      qualityScore: updatedProperty.moderation?.qualityScore,
      publishedAt: updatedProperty.publishedAt.toISOString(),
      expiresAt: updatedProperty.expiresAt?.toISOString(),
    },
    { key: id }
  );

  return updatedProperty;
}

/**
 * Unpublish property
 */
async function unpublish(id, userId, orgId) {
  const property = await propertyRepository.findById(id);

  // Check ownership or admin
  if (property.owner.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (orgId && property.owner.orgId !== orgId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (property.status !== 'PUBLISHED') {
    throw new AppError(
      'Property can only be unpublished from PUBLISHED status',
      ErrorCodes.INVALID_STATE_TRANSITION,
      400
    );
  }

  const updatedProperty = await propertyRepository.updateStatus(id, 'DRAFT');

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.PROPERTY,
    EVENT_TYPES.PROPERTY.UNPUBLISHED,
    {
      propertyId: id,
      slug: updatedProperty.slug,
      unpublishedAt: new Date().toISOString(),
    },
    { key: id }
  );

  return updatedProperty;
}

/**
 * Expire property
 */
async function expire(id) {
  const property = await propertyRepository.findById(id);

  if (property.status !== 'PUBLISHED') {
    throw new AppError(
      'Property can only be expired from PUBLISHED status',
      ErrorCodes.INVALID_STATE_TRANSITION,
      400
    );
  }

  const updatedProperty = await propertyRepository.updateStatus(id, 'EXPIRED');

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.PROPERTY,
    EVENT_TYPES.PROPERTY.EXPIRED,
    {
      propertyId: id,
      slug: updatedProperty.slug,
      expiredAt: new Date().toISOString(),
    },
    { key: id }
  );

  return updatedProperty;
}

/**
 * Archive property
 */
async function archive(id, userId, orgId) {
  const property = await propertyRepository.findById(id);

  // Check ownership
  if (property.owner.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (orgId && property.owner.orgId !== orgId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  const updatedProperty = await propertyRepository.updateStatus(id, 'ARCHIVED');

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.PROPERTY,
    EVENT_TYPES.PROPERTY.ARCHIVED,
    {
      propertyId: id,
      slug: updatedProperty.slug,
      archivedAt: new Date().toISOString(),
    },
    { key: id }
  );

  return updatedProperty;
}

/**
 * Restore archived property
 */
async function restore(id, userId, orgId) {
  const property = await propertyRepository.findById(id);

  // Check ownership
  if (property.owner.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (orgId && property.owner.orgId !== orgId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (property.status !== 'ARCHIVED') {
    throw new AppError(
      'Property can only be restored from ARCHIVED status',
      ErrorCodes.INVALID_STATE_TRANSITION,
      400
    );
  }

  return propertyRepository.updateStatus(id, 'DRAFT');
}

/**
 * Mark property as sold
 */
async function markSold(id, userId, orgId) {
  const property = await propertyRepository.findById(id);

  // Check ownership
  if (property.owner.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (orgId && property.owner.orgId !== orgId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  const updatedProperty = await propertyRepository.updateStatus(id, 'ARCHIVED', {
    soldAt: new Date(),
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.PROPERTY,
    EVENT_TYPES.PROPERTY.SOLD,
    {
      propertyId: id,
      slug: updatedProperty.slug,
      transactionDate: updatedProperty.soldAt.toISOString(),
      markedAt: new Date().toISOString(),
      markedBy: userId,
    },
    { key: id }
  );

  return updatedProperty;
}

/**
 * Mark property as rented
 */
async function markRented(id, userId, orgId) {
  const property = await propertyRepository.findById(id);

  // Check ownership
  if (property.owner.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (orgId && property.owner.orgId !== orgId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  const updatedProperty = await propertyRepository.updateStatus(id, 'ARCHIVED', {
    rentedAt: new Date(),
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.PROPERTY,
    EVENT_TYPES.PROPERTY.RENTED,
    {
      propertyId: id,
      slug: updatedProperty.slug,
      transactionDate: updatedProperty.rentedAt.toISOString(),
      markedAt: new Date().toISOString(),
      markedBy: userId,
    },
    { key: id }
  );

  return updatedProperty;
}

/**
 * Refresh/bump property listing
 */
async function refresh(id, userId, orgId) {
  const property = await propertyRepository.findById(id);

  // Check ownership
  if (property.owner.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (orgId && property.owner.orgId !== orgId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (property.status !== 'PUBLISHED') {
    throw new AppError(
      'Property can only be refreshed when PUBLISHED',
      ErrorCodes.INVALID_STATE_TRANSITION,
      400
    );
  }

  const updatedProperty = await propertyRepository.update(id, {
    lastRefreshedAt: new Date(),
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.PROPERTY,
    EVENT_TYPES.PROPERTY.REFRESHED,
    {
      propertyId: id,
      slug: updatedProperty.slug,
      refreshedAt: new Date().toISOString(),
    },
    { key: id }
  );

  return updatedProperty;
}

module.exports = {
  submit,
  resubmit,
  publish,
  unpublish,
  expire,
  archive,
  restore,
  markSold,
  markRented,
  refresh,
};
