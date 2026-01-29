'use strict';

const { httpStatus } = require('@real-estate/common');

const savedSearchService = require('../services/saved-search.service');

/**
 * List saved searches
 */
async function listSavedSearches(req, res, next) {
  try {
    const userId = req.user.id;
    const options = {
      limit: parseInt(req.query.limit, 10) || 20,
      offset: parseInt(req.query.offset, 10) || 0,
    };

    const result = await savedSearchService.listSavedSearches(userId, options);

    res.status(httpStatus.OK).json({
      success: true,
      data: result.searches,
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
 * Create saved search
 */
async function createSavedSearch(req, res, next) {
  try {
    const userId = req.user.id;

    const search = await savedSearchService.createSavedSearch(userId, req.body);

    res.status(httpStatus.CREATED).json({
      success: true,
      data: search,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get saved search
 */
async function getSavedSearch(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const search = await savedSearchService.getSavedSearch(userId, id);

    res.status(httpStatus.OK).json({
      success: true,
      data: search,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update saved search
 */
async function updateSavedSearch(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const search = await savedSearchService.updateSavedSearch(userId, id, req.body);

    res.status(httpStatus.OK).json({
      success: true,
      data: search,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete saved search
 */
async function deleteSavedSearch(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await savedSearchService.deleteSavedSearch(userId, id);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Saved search deleted',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listSavedSearches,
  createSavedSearch,
  getSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
};
