'use strict';

const { createLogger } = require('@real-estate/common');

const logger = createLogger({ service: 'notification-worker' });

/**
 * Send email notification
 * TODO: Integrate with actual email provider (SendGrid, SES, etc.)
 */
async function send({ to, subject, body: _body, variables: _variables }) {
  try {
    // Placeholder - integrate with actual email provider
    logger.info({ to, subject }, 'Sending email notification');

    // Simulate email sending
    // In production, use SendGrid, AWS SES, etc.
    // const emailProvider = getEmailProvider(config.providers.email.provider);
    // const result = await emailProvider.send({ to, subject, body });

    return {
      success: true,
      response: { messageId: `email-${Date.now()}` },
    };
  } catch (error) {
    logger.error({ error, to }, 'Failed to send email');
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  send,
};
