'use strict';

const { httpStatus } = require('@real-estate/common');

const shortlistService = require('../services/shortlist.service');

/**
 * List shortlisted properties
 */
async function listShortlists(req, res, next) {
  try {
    const userId = req.user.id;
    const options = {
      limit: parseInt(req.query.limit, 10) || 20,
      offset: parseInt(req.query.offset, 10) || 0,
    };

    const result = await shortlistService.listShortlists(userId, options);

    res.status(httpStatus.OK).json({
      success: true,
      data: result.shortlists,
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
 * Add to shortlist
 */
async function addToShortlist(req, res, next) {
  try {
    const userId = req.user.id;
    const { propertyId } = req.body;

    const shortlist = await shortlistService.addToShortlist(userId, propertyId);

    res.status(httpStatus.CREATED).json({
      success: true,
      data: shortlist,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove from shortlist
 */
async function removeFromShortlist(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await shortlistService.removeFromShortlist(userId, id);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Removed from shortlist',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk add/remove from shortlist
 */
async function bulkUpdateShortlist(req, res, next) {
  try {
    const userId = req.user.id;
    const { propertyIds, action } = req.body;

    const result = await shortlistService.bulkUpdateShortlist(userId, propertyIds, action);

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listShortlists,
  addToShortlist,
  removeFromShortlist,
  bulkUpdateShortlist,
};
