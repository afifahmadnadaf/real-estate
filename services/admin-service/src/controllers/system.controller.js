'use strict';

const { httpStatus } = require('@real-estate/common');

const systemService = require('../services/system.service');

/**
 * Get system status
 */
async function getSystemStatus(req, res, next) {
  try {
    const status = await systemService.getSystemStatus();
    res.status(httpStatus.OK).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get system statistics
 */
async function getSystemStats(req, res, next) {
  try {
    const stats = await systemService.getSystemStats();
    res.status(httpStatus.OK).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

async function getDependencies(req, res, next) {
  try {
    const stats = await systemService.getSystemStats();
    res.status(httpStatus.OK).json({
      success: true,
      data: stats.dependencies || stats,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSystemStatus,
  getSystemStats,
  getDependencies,
};
