'use strict';

const { AppError, ErrorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');
const { createProducer, TOPICS, EVENT_TYPES } = require('@real-estate/events');

const preferenceService = require('./preference.service');

// Create a singleton producer instance
let eventProducer = null;

async function getProducer() {
  if (!eventProducer) {
    eventProducer = createProducer({ service: 'notification-service' });
    await eventProducer.connect();
  }
  return eventProducer;
}

/**
 * Send notification
 */
async function sendNotification(data) {
  const { userId, templateCode, channels, variables, priority = 'NORMAL' } = data;

  // Get template
  const template = await prisma.notificationTemplate.findUnique({
    where: { code: templateCode },
  });

  if (!template || !template.isActive) {
    throw new AppError('Template not found or inactive', ErrorCodes.NOT_FOUND, 404);
  }

  // Check user preferences
  const userPreferences = await preferenceService.getPreferences(userId);
  const enabledChannels = channels || template.channels;
  const finalChannels = enabledChannels.filter((channel) => {
    const pref = userPreferences[channel.toLowerCase()];
    return pref !== false; // Only send if not explicitly disabled
  });

  if (finalChannels.length === 0) {
    throw new AppError('No enabled channels', ErrorCodes.VALIDATION_ERROR, 400);
  }

  // Create notification record
  const notification = await prisma.notification.create({
    data: {
      userId,
      type: template.category,
      category: template.category,
      title: template.name,
      body: template.emailBody || template.smsBody || '',
      data: variables || {},
    },
  });

  // Emit event for worker to process
  const producer = await getProducer();
  await producer.publish(
    TOPICS.NOTIFICATION,
    EVENT_TYPES.NOTIFICATION.REQUESTED,
    {
      notificationId: notification.id,
      userId,
      templateCode,
      channels: finalChannels,
      variables: variables || {},
      priority,
      createdAt: notification.createdAt.toISOString(),
    },
    { key: notification.id }
  );

  return notification;
}

/**
 * List notifications
 */
async function listNotifications(userId, filters = {}) {
  const where = { userId };
  if (filters.read !== undefined) {
    where.read = filters.read === 'true';
  }
  if (filters.category) {
    where.category = filters.category;
  }

  return prisma.notification.findMany({
    where,
    include: {
      template: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 50,
    skip: filters.offset || 0,
  });
}

/**
 * Get notification
 */
async function getNotification(notificationId, userId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    include: {
      template: true,
      logs: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!notification) {
    throw new AppError('Notification not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (notification.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  return notification;
}

/**
 * Mark notification as read
 */
async function markAsRead(notificationId, userId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new AppError('Notification not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (notification.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true, readAt: new Date() },
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.NOTIFICATION,
    EVENT_TYPES.NOTIFICATION.READ,
    {
      notificationId,
      userId,
      readAt: updated.readAt.toISOString(),
    },
    { key: notificationId }
  );

  return updated;
}

/**
 * Mark all as read
 */
async function markAllAsRead(userId) {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  return result;
}

/**
 * List notification delivery logs (admin)
 */
async function listDeliveryLogs(filters = {}) {
  const where = {};
  if (filters.userId) {
    where.userId = filters.userId;
  }
  if (filters.notificationId) {
    where.notificationId = filters.notificationId;
  }
  if (filters.channel) {
    where.channel = filters.channel;
  }
  if (filters.status) {
    where.status = filters.status;
  }

  return prisma.notificationLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 100,
    skip: filters.offset || 0,
  });
}

module.exports = {
  sendNotification,
  listNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  listDeliveryLogs,
};
