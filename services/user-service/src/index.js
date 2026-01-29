'use strict';

require('dotenv').config();

const { createLogger } = require('@real-estate/common');
const { connectPrisma, disconnectPrisma } = require('@real-estate/db-models');
const { createProducer } = require('@real-estate/events');
const Redis = require('ioredis');

const app = require('./app');
const config = require('./config');

const logger = createLogger({ service: 'user-service' });
const PORT = config.port;

// Initialize connections
let redis = null;
let eventProducer = null;

async function startServer() {
  try {
    // Connect to PostgreSQL
    await connectPrisma();
    logger.info('Connected to PostgreSQL');

    // Connect to Redis
    redis = new Redis(config.redis.url);
    redis.on('connect', () => logger.info('Connected to Redis'));
    redis.on('error', (err) => logger.error('Redis error:', err));

    // Initialize event producer
    eventProducer = createProducer({ service: 'user-service' });
    await eventProducer.connect();
    logger.info('Connected to Kafka');

    // Make connections available to app
    app.set('redis', redis);
    app.set('eventProducer', eventProducer);

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`User Service started on port ${PORT}`);
      logger.info(`Environment: ${config.env}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        try {
          await disconnectPrisma();
          if (redis) {
            await redis.quit();
          }
          if (eventProducer) {
            await eventProducer.disconnect();
          }
          logger.info('All connections closed');
          process.exit(0);
        } catch (err) {
          logger.error('Error during shutdown:', err);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();
