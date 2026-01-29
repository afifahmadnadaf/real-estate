'use strict';

require('dotenv').config();

const { createLogger } = require('@real-estate/common');
const { connectMongo } = require('@real-estate/db-models');

const app = require('./app');
const config = require('./config');

const logger = createLogger({ service: 'media-service' });

async function start() {
  try {
    // Connect to MongoDB
    await connectMongo({ uri: config.mongo.url, options: config.mongo.options });
    logger.info('Connected to MongoDB');

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Media Service listening on port ${config.port}`);
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
