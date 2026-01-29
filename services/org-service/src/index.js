'use strict';

require('dotenv').config();

const { createLogger } = require('@real-estate/common');
const { connectPrisma, disconnectPrisma } = require('@real-estate/db-models');
const { createProducer } = require('@real-estate/events');

const app = require('./app');
const config = require('./config');

const logger = createLogger({ service: 'org-service' });
const PORT = config.port;

let eventProducer = null;

async function startServer() {
  try {
    // Connect to PostgreSQL
    await connectPrisma();
    logger.info('Connected to PostgreSQL');

    // Initialize event producer
    eventProducer = createProducer({ service: 'org-service' });
    await eventProducer.connect();
    logger.info('Connected to Kafka');

    app.set('eventProducer', eventProducer);

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Org Service started on port ${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down...`);

      server.close(async () => {
        try {
          await disconnectPrisma();
          if (eventProducer) {
            await eventProducer.disconnect();
          }
          process.exit(0);
        } catch (err) {
          logger.error('Error during shutdown:', err);
          process.exit(1);
        }
      });

      setTimeout(() => process.exit(1), 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

startServer();
