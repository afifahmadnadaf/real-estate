'use strict';

require('dotenv').config();

const { createLogger } = require('@real-estate/common');
const { connectMongo } = require('@real-estate/db-models');
const { createConsumer, TOPICS, EVENT_TYPES } = require('@real-estate/events');

const config = require('./config');
const processor = require('./processor');

const logger = createLogger({ service: 'media-processor-worker' });

async function start() {
  try {
    // Connect to MongoDB
    await connectMongo({ uri: config.mongo.url, options: config.mongo.options });
    logger.info('Connected to MongoDB');

    // Create Kafka consumer
    const consumer = createConsumer({
      groupId: config.kafka.groupId,
      service: 'media-processor-worker',
    });

    await consumer.connect();
    logger.info('Connected to Kafka');

    // Subscribe to media events
    await consumer.subscribe([TOPICS.MEDIA], { fromBeginning: false });

    // Register handlers
    consumer.on(EVENT_TYPES.MEDIA.UPLOAD_COMPLETED, async (payload, context) => {
      try {
        logger.info(
          { eventId: context.eventId, mediaId: payload.mediaId },
          'Processing media upload'
        );
        await processor.processMedia(payload);
        logger.info(
          { eventId: context.eventId, mediaId: payload.mediaId },
          'Media processed successfully'
        );
      } catch (error) {
        logger.error({ error, eventId: context.eventId }, 'Failed to process media');
        // In production, you might want to send to a dead letter queue
      }
    });

    await consumer.run();

    logger.info('Media Processor Worker started');

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
