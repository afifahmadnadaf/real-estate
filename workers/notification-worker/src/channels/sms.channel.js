'use strict';

const { createLogger } = require('@real-estate/common');

const logger = createLogger({ service: 'notification-worker' });

/**
 * Send SMS notification
 * TODO: Integrate with actual SMS provider (Twilio, MSG91, etc.)
 */
async function send({ to, body: _body, variables: _variables }) {
  try {
    // Placeholder - integrate with actual SMS provider
    logger.info({ to }, 'Sending SMS notification');

    // Simulate SMS sending
    // In production, use Twilio, MSG91, etc.
    // const smsProvider = getSmsProvider(config.providers.sms.provider);
    // const result = await smsProvider.send({ to, body });

    return {
      success: true,
      response: { messageId: `sms-${Date.now()}` },
    };
  } catch (error) {
    logger.error({ error, to }, 'Failed to send SMS');
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  send,
};
