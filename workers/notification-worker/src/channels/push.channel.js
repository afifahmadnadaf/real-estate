'use strict';

const { createLogger } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

const logger = createLogger({ service: 'notification-worker' });

/**
 * Send push notification
 * TODO: Integrate with actual push provider (FCM, APNS, etc.)
 */
async function send({ userId, title: _title, body: _body, data: _data }) {
  try {
    // Get user's push tokens
    const tokens = await prisma.pushToken.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (tokens.length === 0) {
      logger.warn({ userId }, 'No active push tokens found');
      return {
        success: false,
        error: 'No push tokens',
      };
    }

    // Placeholder - integrate with actual push provider
    logger.info({ userId, tokenCount: tokens.length }, 'Sending push notification');

    // Simulate push sending
    // In production, use FCM, APNS, etc.
    // const pushProvider = getPushProvider(config.providers.push.provider);
    // const results = await Promise.all(
    //   tokens.map((token) => pushProvider.send({ token: token.token, title, body, data }))
    // );

    return {
      success: true,
      response: { sentTo: tokens.length },
    };
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send push notification');
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  send,
};
