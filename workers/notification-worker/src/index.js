'use strict';

require('dotenv').config();

const { createLogger } = require('@real-estate/common');
const { connectPrisma } = require('@real-estate/db-models');
const { createConsumer, TOPICS, EVENT_TYPES, CONSUMER_GROUPS } = require('@real-estate/events');

const config = require('./config');
const notificationHandler = require('./handlers/notification.handler');

const logger = createLogger({ service: 'notification-worker' });

async function start() {
  try {
    // Connect to PostgreSQL
    await connectPrisma();
    logger.info('Connected to PostgreSQL');

    // Create Kafka consumer
    const consumer = createConsumer({
      groupId: CONSUMER_GROUPS.NOTIFICATION_WORKER,
      clientId: config.kafka.clientId,
    });

    await consumer.connect();
    logger.info('Connected to Kafka');

    // Subscribe to notification topic
    await consumer.subscribe(TOPICS.NOTIFICATION);

    // Register event handlers (use shared EventConsumer dispatch)
    consumer.on(
      EVENT_TYPES.NOTIFICATION.REQUESTED,
      notificationHandler.handleNotificationRequested
    );

    // Start consuming using EventConsumer's built-in runner (with idempotency)
    await consumer.run();

    logger.info('Notification Worker started');

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      await consumer.disconnect();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error({ error }, 'Failed to start worker');
    process.exit(1);
  }
}

start();
