'use strict';

const { createLogger } = require('@real-estate/common');
const { createConsumer, TOPICS, EVENT_TYPES, CONSUMER_GROUPS } = require('@real-estate/events');

const moderationService = require('../../services/moderation.service');

const logger = createLogger({ service: 'moderation-service', component: 'property-consumer' });

/**
 * Initialize property event consumer
 */
async function initialize() {
  const consumer = createConsumer({
    groupId: CONSUMER_GROUPS.MODERATION_SERVICE,
    service: 'moderation-service',
  });

  await consumer.connect();
  logger.info('Property event consumer connected');

  // Subscribe to property events
  await consumer.subscribe([TOPICS.PROPERTY], { fromBeginning: false });

  // Handle property submitted event
  consumer.on(EVENT_TYPES.PROPERTY.SUBMITTED, async (event) => {
    try {
      const { propertyId } = event.payload;
      logger.info({ propertyId, eventId: event.eventId }, 'Processing property submission');

      await moderationService.processPropertySubmission(propertyId);

      logger.info({ propertyId }, 'Property moderation processed');
    } catch (error) {
      logger.error({ error, eventId: event.eventId }, 'Failed to process property submission');
    }
  });

  // Start consuming
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        const eventType = event.eventType;

        logger.debug({ eventType, topic, partition }, 'Received property event');

        // Get handlers for this event type
        const handlers = consumer.handlers.get(eventType) || [];
        const allHandlers = consumer.handlers.get('*') || [];

        // Execute handlers
        const context = { topic, partition, offset: message.offset };
        for (const handler of [...handlers, ...allHandlers]) {
          await handler(event, context);
        }
      } catch (error) {
        logger.error({ error, topic, partition }, 'Error processing property event');
      }
    },
  });

  logger.info('Property event consumer started');

  return consumer;
}

module.exports = {
  initialize,
};
