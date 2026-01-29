'use strict';

const { createLogger } = require('@real-estate/common');

const logger = createLogger({ service: 'notification-worker' });

/**
 * Send WhatsApp notification
 * TODO: Integrate with actual WhatsApp provider (Twilio, etc.)
 */
async function send({ to, templateId, variables: _variables }) {
  try {
    // Placeholder - integrate with actual WhatsApp provider
    logger.info({ to, templateId }, 'Sending WhatsApp notification');

    // Simulate WhatsApp sending
    // In production, use Twilio WhatsApp API, etc.
    // const whatsappProvider = getWhatsAppProvider(config.providers.whatsapp.provider);
    // const result = await whatsappProvider.send({ to, templateId, variables });

    return {
      success: true,
      response: { messageId: `whatsapp-${Date.now()}` },
    };
  } catch (error) {
    logger.error({ error, to }, 'Failed to send WhatsApp notification');
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  send,
};
