'use strict';

require('dotenv').config();

const { createLogger } = require('@real-estate/common');
const { connectPrisma, connectRedis } = require('@real-estate/db-models');

const app = require('./app');
const config = require('./config');

const logger = createLogger({ service: 'notification-service' });

async function start() {
  try {
    // Connect to PostgreSQL
    await connectPrisma();
    logger.info('Connected to PostgreSQL');

    // Connect to Redis
    await connectRedis();
    logger.info('Connected to Redis');

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Notification Service listening on port ${config.port}`);
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
