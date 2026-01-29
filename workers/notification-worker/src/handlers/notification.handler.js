'use strict';

const { createLogger } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

const dispatcher = require('../services/dispatcher');
const templateRenderer = require('../services/template-renderer');

const logger = createLogger({ service: 'notification-worker' });

/**
 * Handle notification requested event
 * @param {Object} payload - Event payload
 * @param {Object} context - Kafka context (topic, partition, offset, headers, traceId, ...)
 * @param {Object} event - Full event envelope
 */
async function handleNotificationRequested(payload, context, event) {
  try {
    const { notificationId, userId, templateCode, channels, variables } = payload;

    // Get notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        template: true,
      },
    });

    if (!notification) {
      logger.error({ notificationId }, 'Notification not found');
      return;
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    if (!user) {
      logger.error({ userId }, 'User not found');
      return;
    }

    // Get template
    const template =
      notification.template ||
      (await prisma.notificationTemplate.findUnique({
        where: { code: templateCode },
      }));

    if (!template) {
      logger.error({ templateCode }, 'Template not found');
      return;
    }

    // Render templates for each channel
    const rendered = templateRenderer.render(template, variables || {});

    // Send via each channel
    const results = [];
    for (const channel of channels) {
      try {
        const result = await dispatcher.send(channel, {
          userId,
          user,
          notification,
          template,
          rendered,
          variables: variables || {},
        });

        // Log delivery
        await prisma.notificationLog.create({
          data: {
            notificationId,
            userId,
            channel,
            templateId: template.id,
            recipient: getRecipient(channel, user),
            status: result.success ? 'SENT' : 'FAILED',
            providerResponse: result.response || null,
            error: result.error || null,
            sentAt: result.success ? new Date() : null,
          },
        });

        results.push({ channel, success: result.success });
      } catch (error) {
        logger.error({ error, channel, notificationId }, 'Failed to send notification');

        // Log failure
        await prisma.notificationLog.create({
          data: {
            notificationId,
            userId,
            channel,
            templateId: template.id,
            recipient: getRecipient(channel, user),
            status: 'FAILED',
            error: error.message,
          },
        });

        results.push({ channel, success: false, error: error.message });
      }
    }

    logger.info(
      { notificationId, results, eventId: event?.eventId, eventType: event?.eventType },
      'Notification processed'
    );
  } catch (error) {
    logger.error(
      { error, eventId: event?.eventId, eventType: event?.eventType },
      'Error handling notification request'
    );
  }
}

/**
 * Get recipient based on channel
 */
function getRecipient(channel, user) {
  switch (channel) {
    case 'EMAIL':
      return user.email || '';
    case 'SMS':
    case 'WHATSAPP':
      return user.phone || '';
    case 'PUSH':
      return user.id; // For push, recipient is user ID
    default:
      return '';
  }
}

module.exports = {
  handleNotificationRequested,
};
