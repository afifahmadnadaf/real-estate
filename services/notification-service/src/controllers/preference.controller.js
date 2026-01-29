'use strict';

const { httpStatus } = require('@real-estate/common');

const preferenceService = require('../services/preference.service');

/**
 * Get preferences
 */
async function getPreferences(req, res, next) {
  try {
    const userId = req.user.id;
    const preferences = await preferenceService.getPreferences(userId);
    res.status(httpStatus.OK).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update preferences
 */
async function updatePreferences(req, res, next) {
  try {
    const userId = req.user.id;
    const preferences = await preferenceService.updatePreferences(userId, req.body);
    res.status(httpStatus.OK).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPreferences,
  updatePreferences,
};
