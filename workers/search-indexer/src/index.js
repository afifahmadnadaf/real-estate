'use strict';

require('dotenv').config();

const { createLogger } = require('@real-estate/common');
const { connectMongo } = require('@real-estate/db-models');
const { createConsumer, TOPICS, EVENT_TYPES } = require('@real-estate/events');

const config = require('./config');
const indexer = require('./indexer');

const logger = createLogger({ service: 'search-indexer-worker' });

async function start() {
  try {
    // Connect to MongoDB
    await connectMongo({ uri: config.mongo.url, options: config.mongo.options });
    logger.info('Connected to MongoDB');

    // Create Kafka consumer
    const consumer = createConsumer({
      groupId: config.kafka.groupId,
      service: 'search-indexer-worker',
    });

    await consumer.connect();
    logger.info('Connected to Kafka');

    // Subscribe to property events
    await consumer.subscribe([TOPICS.PROPERTY], { fromBeginning: false });

    // Register handlers
    consumer.on(EVENT_TYPES.PROPERTY.PUBLISHED, async (payload, context) => {
      try {
        const { propertyId } = payload;
        logger.info({ propertyId, eventId: context.eventId }, 'Indexing published property');
        await indexer.indexProperty(propertyId);
        logger.info({ propertyId }, 'Property indexed successfully');
      } catch (error) {
        logger.error({ error, eventId: context.eventId }, 'Failed to index property');
      }
    });

    consumer.on(EVENT_TYPES.PROPERTY.UPDATED, async (payload, context) => {
      try {
        const { propertyId } = payload;
        logger.info({ propertyId, eventId: context.eventId }, 'Updating indexed property');
        await indexer.indexProperty(propertyId);
        logger.info({ propertyId }, 'Property updated in index');
      } catch (error) {
        logger.error({ error, eventId: context.eventId }, 'Failed to update property in index');
      }
    });

    consumer.on(EVENT_TYPES.PROPERTY.UNPUBLISHED, async (payload, context) => {
      try {
        const { propertyId } = payload;
        logger.info({ propertyId, eventId: context.eventId }, 'Removing property from index');
        await indexer.deleteProperty(propertyId);
        logger.info({ propertyId }, 'Property removed from index');
      } catch (error) {
        logger.error({ error, eventId: context.eventId }, 'Failed to remove property from index');
      }
    });

    consumer.on(EVENT_TYPES.PROPERTY.DELETED, async (payload, context) => {
      try {
        const { propertyId } = payload;
        logger.info({ propertyId, eventId: context.eventId }, 'Deleting property from index');
        await indexer.deleteProperty(propertyId);
        logger.info({ propertyId }, 'Property deleted from index');
      } catch (error) {
        logger.error({ error, eventId: context.eventId }, 'Failed to delete property from index');
      }
    });

    consumer.on(EVENT_TYPES.PROPERTY.EXPIRED, async (payload, context) => {
      try {
        const { propertyId } = payload;
        logger.info(
          { propertyId, eventId: context.eventId },
          'Removing expired property from index'
        );
        await indexer.deleteProperty(propertyId);
        logger.info({ propertyId }, 'Expired property removed from index');
      } catch (error) {
        logger.error(
          { error, eventId: context.eventId },
          'Failed to remove expired property from index'
        );
      }
    });

    await consumer.run();

    logger.info('Search Indexer Worker started');

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
