'use strict';

require('dotenv').config();

const { createLogger } = require('@real-estate/common');
const { connectPrisma, connectRedis } = require('@real-estate/db-models');
const { createConsumer, TOPICS, EVENT_TYPES, CONSUMER_GROUPS } = require('@real-estate/events');

const app = require('./app');
const config = require('./config');
const analyticsHandler = require('./handlers/analytics.handler');

const logger = createLogger({ service: 'analytics-service' });

async function start() {
  try {
    // Connect to PostgreSQL
    await connectPrisma();
    logger.info('Connected to PostgreSQL');

    // Connect to Redis
    await connectRedis();
    logger.info('Connected to Redis');

    // Create Kafka consumer for analytics events
    const consumer = createConsumer({
      groupId: CONSUMER_GROUPS.ANALYTICS_WORKER,
      clientId: config.kafka.clientId,
    });

    await consumer.connect();
    logger.info('Connected to Kafka');

    // Subscribe to all event topics
    await consumer.subscribe({ topic: TOPICS.PROPERTY });
    await consumer.subscribe({ topic: TOPICS.LEAD });
    await consumer.subscribe({ topic: TOPICS.BILLING });
    await consumer.subscribe({ topic: TOPICS.USER });

    // Register event handlers
    consumer.on(EVENT_TYPES.ANALYTICS.PAGE_VIEW, analyticsHandler.handlePageView);
    consumer.on(EVENT_TYPES.ANALYTICS.SEARCH, analyticsHandler.handleSearch);
    consumer.on(EVENT_TYPES.ANALYTICS.PROPERTY_VIEW, analyticsHandler.handlePropertyView);
    consumer.on(EVENT_TYPES.ANALYTICS.LEAD_SUBMIT, analyticsHandler.handleLeadSubmit);

    // Start consuming
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          logger.info({ event }, 'Received analytics event');

          // Handle based on event type
          const handlers = consumer.getHandlers(event.type);
          if (handlers && handlers.length > 0) {
            for (const handler of handlers) {
              await handler(event);
            }
          }
        } catch (error) {
          logger.error({ error, topic, partition }, 'Error processing analytics message');
        }
      },
    });

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Analytics Service listening on port ${config.port}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      await consumer.disconnect();
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error({ error }, 'Failed to start service');
    process.exit(1);
  }
}

start();
