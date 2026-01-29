'use strict';

const { createLogger } = require('@real-estate/common');

const emailChannel = require('../channels/email.channel');
const pushChannel = require('../channels/push.channel');
const smsChannel = require('../channels/sms.channel');
const whatsappChannel = require('../channels/whatsapp.channel');

const logger = createLogger({ service: 'notification-worker' });

/**
 * Dispatch notification to appropriate channel
 */
async function send(channel, data) {
  const { userId, user, rendered, variables } = data;

  try {
    switch (channel) {
      case 'EMAIL':
        return await emailChannel.send({
          to: user.email,
          subject: rendered.emailSubject,
          body: rendered.emailBody,
          variables,
        });

      case 'SMS':
        return await smsChannel.send({
          to: user.phone,
          body: rendered.smsBody,
          variables,
        });

      case 'PUSH':
        return await pushChannel.send({
          userId,
          title: rendered.pushTitle,
          body: rendered.pushBody,
          data: variables,
        });

      case 'WHATSAPP':
        return await whatsappChannel.send({
          to: user.phone,
          templateId: data.template.whatsappTemplateId,
          variables,
        });

      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  } catch (error) {
    logger.error({ error, channel, userId }, 'Failed to dispatch notification');
    return { success: false, error: error.message };
  }
}

module.exports = {
  send,
};
