'use strict';

require('dotenv').config();

const { createLogger } = require('@real-estate/common');
const { connectPrisma } = require('@real-estate/db-models');

const app = require('./app');
const config = require('./config');
const propertyConsumer = require('./events/consumers/property.consumer');

const logger = createLogger({ service: 'moderation-service' });

async function start() {
  try {
    // Connect to PostgreSQL
    await connectPrisma();
    logger.info('Connected to PostgreSQL');

    // Initialize property event consumer
    await propertyConsumer.initialize();
    logger.info('Property event consumer initialized');

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Moderation Service listening on port ${config.port}`);
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
