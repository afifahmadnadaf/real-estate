'use strict';

const { httpStatus } = require('@real-estate/common');

const analyticsService = require('../services/analytics.service');

/**
 * Get KPIs
 */
async function getKPIs(req, res, next) {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    const kpis = await analyticsService.getKPIs(filters);
    res.status(httpStatus.OK).json({
      success: true,
      data: kpis,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get funnel
 */
async function getFunnel(req, res, next) {
  try {
    const { type } = req.query;
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    const funnel = await analyticsService.getFunnel(type, filters);
    res.status(httpStatus.OK).json({
      success: true,
      data: funnel,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get cohorts
 */
async function getCohorts(req, res, next) {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    const cohorts = await analyticsService.getCohorts('user', filters);
    res.status(httpStatus.OK).json({
      success: true,
      data: cohorts,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get attribution
 */
async function getAttribution(req, res, next) {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    const attribution = await analyticsService.getAttribution(filters);
    res.status(httpStatus.OK).json({
      success: true,
      data: attribution,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getKPIs,
  getFunnel,
  getCohorts,
  getAttribution,
};
