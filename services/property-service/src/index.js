'use strict';

require('dotenv').config();

const { createLogger } = require('@real-estate/common');
const { connectMongo } = require('@real-estate/db-models');
const { createConsumer, TOPICS, EVENT_TYPES, CONSUMER_GROUPS } = require('@real-estate/events');

const app = require('./app');
const config = require('./config');
const billingConsumer = require('./events/consumers/billing.consumer');

const logger = createLogger({ service: 'property-service' });

async function start() {
  try {
    // Connect to MongoDB
    await connectMongo({ uri: config.mongo.url, options: config.mongo.options });
    logger.info('Connected to MongoDB');

    // Connect to PostgreSQL for billing integration
    const { connectPrisma } = require('@real-estate/db-models');
    await connectPrisma();
    logger.info('Connected to PostgreSQL');

    // Create Kafka consumer for billing events
    const consumer = createConsumer({
      groupId: CONSUMER_GROUPS.PROPERTY_SERVICE,
      clientId: config.kafka.clientId,
    });

    await consumer.connect();
    logger.info('Connected to Kafka');

    // Subscribe to billing topic
    await consumer.subscribe(TOPICS.BILLING);

    // Register billing event handlers (using shared EventConsumer dispatcher)
    consumer.on(
      EVENT_TYPES.BILLING.SUBSCRIPTION_ACTIVATED,
      billingConsumer.handleSubscriptionActivated
    );
    consumer.on(
      EVENT_TYPES.BILLING.SUBSCRIPTION_CANCELLED,
      billingConsumer.handleSubscriptionCancelled
    );
    consumer.on(
      EVENT_TYPES.BILLING.SUBSCRIPTION_EXPIRED,
      billingConsumer.handleSubscriptionCancelled
    );

    // Start consuming using EventConsumer's built-in runner (with idempotency)
    await consumer.run();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Property Service listening on port ${config.port}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
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
