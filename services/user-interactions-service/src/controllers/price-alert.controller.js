'use strict';

const { httpStatus } = require('@real-estate/common');

const priceAlertService = require('../services/price-alert.service');

/**
 * List price alerts
 */
async function listPriceAlerts(req, res, next) {
  try {
    const userId = req.user.id;
    const options = {
      limit: parseInt(req.query.limit, 10) || 20,
      offset: parseInt(req.query.offset, 10) || 0,
      isActive:
        req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    };

    const result = await priceAlertService.listPriceAlerts(userId, options);

    res.status(httpStatus.OK).json({
      success: true,
      data: result.alerts,
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
 * Create price alert
 */
async function createPriceAlert(req, res, next) {
  try {
    const userId = req.user.id;

    const alert = await priceAlertService.createPriceAlert(userId, req.body);

    res.status(httpStatus.CREATED).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update price alert
 */
async function updatePriceAlert(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const alert = await priceAlertService.updatePriceAlert(userId, id, req.body);

    res.status(httpStatus.OK).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete price alert
 */
async function deletePriceAlert(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await priceAlertService.deletePriceAlert(userId, id);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Price alert deleted',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listPriceAlerts,
  createPriceAlert,
  updatePriceAlert,
  deletePriceAlert,
};
