'use strict';

const { httpStatus } = require('@real-estate/common');

const notificationService = require('../services/notification.service');

/**
 * Send test notification
 */
async function sendTest(req, res, next) {
  try {
    const { userId, templateCode, channels, variables } = req.body;
    const notification = await notificationService.sendNotification({
      userId,
      templateCode,
      channels,
      variables,
    });
    res.status(httpStatus.CREATED).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List delivery logs
 */
async function listLogs(req, res, next) {
  try {
    const filters = {
      userId: req.query.userId,
      notificationId: req.query.notificationId,
      channel: req.query.channel,
      status: req.query.status,
      limit: parseInt(req.query.limit, 10) || 100,
      offset: parseInt(req.query.offset, 10) || 0,
    };
    const logs = await notificationService.listDeliveryLogs(filters);
    res.status(httpStatus.OK).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendTest,
  listLogs,
};
