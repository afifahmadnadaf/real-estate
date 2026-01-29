'use strict';

const { httpStatus } = require('@real-estate/common');

const lifecycleService = require('../services/lifecycle.service');
const propertyService = require('../services/property.service');
const versionService = require('../services/version.service');

/**
 * Create a new property (draft)
 */
async function createProperty(req, res, next) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const orgId = req.user.orgId || null;

    const property = await propertyService.createProperty(userId, userRole, req.body, orgId);

    res.status(httpStatus.CREATED).json({
      success: true,
      data: property,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get property by ID
 */
async function getProperty(req, res, next) {
  try {
    const { id } = req.params;
    const includeArchived = req.query.includeArchived === 'true';

    const property = await propertyService.getProperty(id, includeArchived);

    res.status(httpStatus.OK).json({
      success: true,
      data: property,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update property
 */
async function updateProperty(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    const property = await propertyService.updateProperty(id, userId, orgId, req.body);

    res.status(httpStatus.OK).json({
      success: true,
      data: property,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete property
 */
async function deleteProperty(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    await propertyService.deleteProperty(id, userId, orgId);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List properties
 */
async function listProperties(req, res, next) {
  try {
    const filters = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.type) {
      filters.type = req.query.type;
    }
    if (req.query.cityId) {
      filters['location.cityId'] = req.query.cityId;
    }
    if (req.query.localityId) {
      filters['location.localityId'] = req.query.localityId;
    }

    const options = {
      limit: parseInt(req.query.limit, 10) || 20,
      offset: parseInt(req.query.offset, 10) || 0,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };

    const result = await propertyService.listProperties(filters, options);

    res.status(httpStatus.OK).json({
      success: true,
      data: result.properties,
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
 * List my properties
 */
async function listMyProperties(req, res, next) {
  try {
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    const filters = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.type) {
      filters.type = req.query.type;
    }

    const options = {
      limit: parseInt(req.query.limit, 10) || 20,
      offset: parseInt(req.query.offset, 10) || 0,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };

    const result = await propertyService.listMyProperties(userId, orgId, filters, options);

    res.status(httpStatus.OK).json({
      success: true,
      data: result.properties,
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
 * Submit property for moderation
 */
async function submitProperty(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    const property = await lifecycleService.submit(id, userId, orgId);

    res.status(httpStatus.OK).json({
      success: true,
      data: property,
      message: 'Property submitted for moderation',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Resubmit property after changes
 */
async function resubmitProperty(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    const property = await lifecycleService.resubmit(id, userId, orgId);

    res.status(httpStatus.OK).json({
      success: true,
      data: property,
      message: 'Property resubmitted for moderation',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Publish property (admin only)
 */
async function publishProperty(req, res, next) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const property = await lifecycleService.publish(id, adminId);

    res.status(httpStatus.OK).json({
      success: true,
      data: property,
      message: 'Property published successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Unpublish property
 */
async function unpublishProperty(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    const property = await lifecycleService.unpublish(id, userId, orgId);

    res.status(httpStatus.OK).json({
      success: true,
      data: property,
      message: 'Property unpublished successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Expire property
 */
async function expireProperty(req, res, next) {
  try {
    const { id } = req.params;

    const property = await lifecycleService.expire(id);

    res.status(httpStatus.OK).json({
      success: true,
      data: property,
      message: 'Property expired successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Archive property
 */
async function archiveProperty(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    const property = await lifecycleService.archive(id, userId, orgId);

    res.status(httpStatus.OK).json({
      success: true,
      data: property,
      message: 'Property archived successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Restore archived property
 */
async function restoreProperty(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    const property = await lifecycleService.restore(id, userId, orgId);

    res.status(httpStatus.OK).json({
      success: true,
      data: property,
      message: 'Property restored successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark property as sold
 */
async function markSold(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    const property = await lifecycleService.markSold(id, userId, orgId);

    res.status(httpStatus.OK).json({
      success: true,
      data: property,
      message: 'Property marked as sold',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark property as rented
 */
async function markRented(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    const property = await lifecycleService.markRented(id, userId, orgId);

    res.status(httpStatus.OK).json({
      success: true,
      data: property,
      message: 'Property marked as rented',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh/bump property listing
 */
async function refreshProperty(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    const property = await lifecycleService.refresh(id, userId, orgId);

    res.status(httpStatus.OK).json({
      success: true,
      data: property,
      message: 'Property refreshed successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get property version history
 */
async function getVersionHistory(req, res, next) {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit, 10) || 10;

    const versions = await versionService.getVersionHistory(id, limit);

    res.status(httpStatus.OK).json({
      success: true,
      data: versions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Attach media to property
 */
async function attachMedia(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    const property = await propertyService.attachMedia(id, userId, orgId, req.body);

    res.status(httpStatus.OK).json({
      success: true,
      data: property,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reorder media
 */
async function reorderMedia(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    const property = await propertyService.reorderMedia(id, userId, orgId, req.body.mediaIds);

    res.status(httpStatus.OK).json({
      success: true,
      data: property,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Detach media from property
 */
async function detachMedia(req, res, next) {
  try {
    const { id, mediaId } = req.params;
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    const property = await propertyService.detachMedia(id, mediaId, userId, orgId);

    res.status(httpStatus.OK).json({
      success: true,
      data: property,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Attach document to property
 */
async function attachDocument(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    const property = await propertyService.attachDocument(id, userId, orgId, req.body);

    res.status(httpStatus.OK).json({
      success: true,
      data: property,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove document from property
 */
async function removeDocument(req, res, next) {
  try {
    const { id, docId } = req.params;
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    const property = await propertyService.removeDocument(id, docId, userId, orgId);

    res.status(httpStatus.OK).json({
      success: true,
      data: property,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get similar properties
 */
async function getSimilarProperties(req, res, next) {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit, 10) || 10;

    const properties = await propertyService.getSimilarProperties(id, limit);

    res.status(httpStatus.OK).json({
      success: true,
      data: properties,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Batch fetch properties by IDs
 */
async function batchFetchProperties(req, res, next) {
  try {
    const { ids } = req.body;

    const properties = await propertyService.batchFetchProperties(ids);

    res.status(httpStatus.OK).json({
      success: true,
      data: properties,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get contact options for property
 */
async function getContactOptions(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    const contactOptions = await propertyService.getContactOptions(id, userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: contactOptions,
    });
  } catch (error) {
    next(error);
  }
}

async function getAudit(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orgId = req.user.orgId || null;
    const role = req.user.role;

    const audit = await propertyService.getAudit(id, userId, orgId, role);

    res.status(httpStatus.OK).json({
      success: true,
      data: audit,
    });
  } catch (error) {
    next(error);
  }
}

async function checkDuplicate(req, res, next) {
  try {
    const { id } = req.params;
    const result = await propertyService.checkDuplicate(id);
    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProperty,
  getProperty,
  updateProperty,
  deleteProperty,
  listProperties,
  listMyProperties,
  submitProperty,
  resubmitProperty,
  publishProperty,
  unpublishProperty,
  expireProperty,
  archiveProperty,
  restoreProperty,
  markSold,
  markRented,
  refreshProperty,
  getVersionHistory,
  attachMedia,
  reorderMedia,
  detachMedia,
  attachDocument,
  removeDocument,
  getSimilarProperties,
  batchFetchProperties,
  getContactOptions,
  getAudit,
  checkDuplicate,
};
