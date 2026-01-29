'use strict';

const { AppError, ErrorCodes } = require('@real-estate/common');
const { createProducer, TOPICS, EVENT_TYPES } = require('@real-estate/events');

const config = require('../config');
const mediaRepository = require('../repositories/media.repository');

const s3Service = require('./s3.service');

// Create a singleton producer instance
let eventProducer = null;

async function getProducer() {
  if (!eventProducer) {
    eventProducer = createProducer({ service: 'media-service' });
    await eventProducer.connect();
  }
  return eventProducer;
}

/**
 * Validate file type
 */
function validateFileType(mimeType, allowedTypes) {
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file size
 */
function validateFileSize(size) {
  return size <= config.upload.maxFileSize;
}

/**
 * Get file category from mime type
 */
function getFileCategory(mimeType) {
  if (mimeType.startsWith('image/')) {
    return 'IMAGE';
  }
  if (mimeType.startsWith('video/')) {
    return 'VIDEO';
  }
  if (mimeType === 'application/pdf') {
    return 'DOCUMENT';
  }
  return 'OTHER';
}

/**
 * Generate presigned URL for upload
 */
async function generatePresignedUrl(userId, orgId, filename, mimeType, size, purpose = 'general') {
  // Validate file type
  const allowedTypes = [
    ...config.upload.allowedImageTypes,
    ...config.upload.allowedVideoTypes,
    ...config.upload.allowedDocumentTypes,
  ];

  if (!validateFileType(mimeType, allowedTypes)) {
    throw new AppError(`File type ${mimeType} is not allowed`, ErrorCodes.VALIDATION_ERROR, 400);
  }

  // Validate file size
  if (!validateFileSize(size)) {
    throw new AppError(
      `File size exceeds maximum allowed size of ${config.upload.maxFileSize / 1024 / 1024}MB`,
      ErrorCodes.VALIDATION_ERROR,
      400
    );
  }

  // Determine prefix based on purpose
  const prefix =
    purpose === 'property' ? 'properties' : purpose === 'org' ? 'organizations' : 'general';

  // Generate unique key
  const key = s3Service.generateKey(prefix, filename, userId);

  // Generate presigned URL
  const presignedData = await s3Service.generatePresignedUploadUrl(key, mimeType);

  // Create media record
  const media = await mediaRepository.create({
    userId,
    orgId: orgId || null,
    originalKey: key,
    bucket: config.s3.bucket,
    filename,
    mimeType,
    size,
    status: 'PENDING',
    derivatives: [
      {
        size: 'original',
        key,
        url: s3Service.generateCdnUrl(key),
        format: mimeType.split('/')[1],
      },
    ],
    metadata: {
      exifStripped: false,
      contentModeration: {
        status: 'PENDING',
      },
    },
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.MEDIA,
    EVENT_TYPES.MEDIA.UPLOAD_INITIATED,
    {
      mediaId: media._id.toString(),
      userId,
      orgId: orgId || null,
      filename,
      mimeType,
      size,
      bucket: config.s3.bucket,
      key,
      initiatedAt: new Date().toISOString(),
    },
    { key: media._id.toString() }
  );

  return {
    mediaId: media._id.toString(),
    uploadUrl: presignedData.url,
    key: presignedData.key,
    expiresIn: presignedData.expiresIn,
  };
}

/**
 * Complete upload
 */
async function completeUpload(mediaId, userId) {
  const media = await mediaRepository.findById(mediaId);

  // Verify ownership
  if (media.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  // Verify file exists in S3
  const exists = await s3Service.objectExists(media.originalKey);
  if (!exists) {
    throw new AppError('File not found in storage', ErrorCodes.NOT_FOUND, 404);
  }

  // Get object metadata
  const metadata = await s3Service.getObjectMetadata(media.originalKey);

  // Update media record
  const updatedMedia = await mediaRepository.update(mediaId, {
    size: metadata.size,
    status: 'PROCESSING',
  });

  // Generate CDN URL
  const cdnUrl = s3Service.generateCdnUrl(media.originalKey);

  // Update derivatives with CDN URL
  await mediaRepository.updateDerivatives(mediaId, [
    {
      size: 'original',
      key: media.originalKey,
      url: cdnUrl,
      format: media.mimeType.split('/')[1],
    },
  ]);

  // Emit event for processing
  const producer = await getProducer();
  await producer.publish(
    TOPICS.MEDIA,
    EVENT_TYPES.MEDIA.UPLOAD_COMPLETED,
    {
      mediaId: mediaId.toString(),
      userId,
      orgId: media.orgId || null,
      filename: media.filename,
      mimeType: media.mimeType,
      size: metadata.size,
      bucket: config.s3.bucket,
      key: media.originalKey,
      url: cdnUrl,
      completedAt: new Date().toISOString(),
    },
    { key: mediaId.toString() }
  );

  return updatedMedia;
}

/**
 * Get media by ID
 */
async function getMedia(id, userId = null) {
  const media = await mediaRepository.findById(id);

  // Check ownership if userId provided
  if (userId && media.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  return media;
}

/**
 * Get media renditions (all derivatives)
 */
async function getRenditions(id, userId = null) {
  const media = await getMedia(id, userId);
  return media.derivatives || [];
}

/**
 * Delete media
 */
async function deleteMedia(id, userId) {
  const media = await mediaRepository.findById(id);

  // Verify ownership
  if (media.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  // Delete from S3 (all derivatives)
  const keysToDelete = media.derivatives.map((d) => d.key);
  for (const key of keysToDelete) {
    try {
      await s3Service.deleteObject(key);
    } catch (error) {
      // Log but don't fail if S3 delete fails
      console.error(`Failed to delete S3 object ${key}:`, error);
    }
  }

  // Delete media record
  await mediaRepository.remove(id);

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.MEDIA,
    EVENT_TYPES.MEDIA.DELETED,
    {
      mediaId: id,
      deletedBy: userId,
      deletedAt: new Date().toISOString(),
    },
    { key: id }
  );

  return { success: true };
}

/**
 * List user's media
 */
async function listMedia(userId, orgId, filters = {}, options = {}) {
  return mediaRepository.listByUser(userId, orgId, filters, options);
}

/**
 * Add usage tracking
 */
async function addUsage(mediaId, entityType, entityId) {
  return mediaRepository.addUsage(mediaId, entityType, entityId);
}

/**
 * Remove usage tracking
 */
async function removeUsage(mediaId, entityType, entityId) {
  return mediaRepository.removeUsage(mediaId, entityType, entityId);
}

/**
 * Reprocess media (admin)
 */
async function reprocessMedia(mediaId) {
  const media = await mediaRepository.findById(mediaId);

  // Reset status to PENDING to trigger reprocessing
  const updatedMedia = await mediaRepository.update(mediaId, {
    status: 'PENDING',
    processingError: null,
  });

  // Emit event to trigger reprocessing
  const producer = await getProducer();
  await producer.publish(
    TOPICS.MEDIA,
    EVENT_TYPES.MEDIA.PROCESSING_STARTED,
    {
      mediaId: media._id.toString(),
      originalKey: media.originalKey,
      bucket: media.bucket,
      mimeType: media.mimeType,
      reprocess: true,
    },
    { key: media._id.toString() }
  );

  return updatedMedia;
}

/**
 * Get failed media jobs (admin)
 */
async function getFailedJobs(limit = 50, offset = 0) {
  const { MediaModel } = require('@real-estate/db-models');

  const query = { status: 'FAILED' };
  const sort = { createdAt: -1 };

  const [jobs, total] = await Promise.all([
    MediaModel.find(query).sort(sort).skip(offset).limit(limit).exec(),
    MediaModel.countDocuments(query),
  ]);

  return {
    jobs,
    total,
    limit,
    offset,
  };
}

/**
 * Override moderation (admin)
 */
async function overrideModeration(mediaId, override, reason) {
  const media = await mediaRepository.findById(mediaId);

  const updatedMetadata = {
    ...media.metadata,
    contentModeration: {
      ...media.metadata?.contentModeration,
      status: override ? 'APPROVED' : 'REJECTED',
      flags: override ? [] : media.metadata?.contentModeration?.flags || [],
      score: override ? 100 : 0,
      overridden: true,
      overrideReason: reason || 'Admin override',
      overriddenAt: new Date(),
    },
  };

  return mediaRepository.updateMetadata(mediaId, updatedMetadata);
}

module.exports = {
  generatePresignedUrl,
  completeUpload,
  getMedia,
  getRenditions,
  deleteMedia,
  listMedia,
  addUsage,
  removeUsage,
  reprocessMedia,
  getFailedJobs,
  overrideModeration,
  validateFileType,
  validateFileSize,
  getFileCategory,
};
