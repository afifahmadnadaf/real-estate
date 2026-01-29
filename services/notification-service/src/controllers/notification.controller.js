'use strict';

const { httpStatus } = require('@real-estate/common');

const notificationService = require('../services/notification.service');

/**
 * List notifications
 */
async function listNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const filters = {
      read: req.query.read,
      category: req.query.category,
      limit: parseInt(req.query.limit, 10) || 50,
      offset: parseInt(req.query.offset, 10) || 0,
    };
    const notifications = await notificationService.listNotifications(userId, filters);
    res.status(httpStatus.OK).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get notification
 */
async function getNotification(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const notification = await notificationService.getNotification(id, userId);
    res.status(httpStatus.OK).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark as read
 */
async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const notification = await notificationService.markAsRead(id, userId);
    res.status(httpStatus.OK).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark all as read
 */
async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await notificationService.markAllAsRead(userId);
    res.status(httpStatus.OK).json({
      success: true,
      data: { count: result.count },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
};
