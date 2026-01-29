'use strict';

const { httpStatus } = require('@real-estate/common');

const mediaService = require('../services/media.service');

/**
 * Generate presigned URL for upload
 */
async function generatePresignedUrl(req, res, next) {
  try {
    const userId = req.user.id;
    const orgId = req.user.orgId || null;
    const { filename, mimeType, size, purpose } = req.body;

    const result = await mediaService.generatePresignedUrl(
      userId,
      orgId,
      filename,
      mimeType,
      size,
      purpose
    );

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Complete upload
 */
async function completeUpload(req, res, next) {
  try {
    const userId = req.user.id;
    const { mediaId } = req.body;

    const media = await mediaService.completeUpload(mediaId, userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: media,
      message: 'Upload completed successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get media by ID
 */
async function getMedia(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    const media = await mediaService.getMedia(id, userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: media,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get media renditions
 */
async function getRenditions(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    const renditions = await mediaService.getRenditions(id, userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: renditions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete media
 */
async function deleteMedia(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await mediaService.deleteMedia(id, userId);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List user's media
 */
async function listMedia(req, res, next) {
  try {
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    const filters = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.mimeType) {
      filters.mimeType = req.query.mimeType;
    }

    const options = {
      limit: parseInt(req.query.limit, 10) || 20,
      offset: parseInt(req.query.offset, 10) || 0,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };

    const result = await mediaService.listMedia(userId, orgId, filters, options);

    res.status(httpStatus.OK).json({
      success: true,
      data: result.media,
      meta: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add usage tracking
 */
async function addUsage(req, res, next) {
  try {
    const { id } = req.params;
    const { entityType, entityId } = req.body;

    await mediaService.addUsage(id, entityType, entityId);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Usage tracking added',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove usage tracking
 */
async function removeUsage(req, res, next) {
  try {
    const { id } = req.params;
    const { entityType, entityId } = req.body;

    await mediaService.removeUsage(id, entityType, entityId);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Usage tracking removed',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reprocess media (admin)
 */
async function reprocessMedia(req, res, next) {
  try {
    const { id } = req.params;

    const media = await mediaService.reprocessMedia(id);

    res.status(httpStatus.OK).json({
      success: true,
      data: media,
      message: 'Media reprocessing initiated',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get failed media jobs (admin)
 */
async function getFailedJobs(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    const result = await mediaService.getFailedJobs(limit, offset);

    res.status(httpStatus.OK).json({
      success: true,
      data: result.jobs,
      meta: {
        total: result.total,
        limit,
        offset,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Override moderation (admin)
 */
async function overrideModeration(req, res, next) {
  try {
    const { id } = req.params;
    const { override, reason } = req.body;

    const media = await mediaService.overrideModeration(id, override, reason);

    res.status(httpStatus.OK).json({
      success: true,
      data: media,
      message: 'Moderation override applied',
    });
  } catch (error) {
    next(error);
  }
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
};
