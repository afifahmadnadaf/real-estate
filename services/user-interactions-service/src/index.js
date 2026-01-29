'use strict';

require('dotenv').config();
const { createLogger } = require('@real-estate/common');
const { connectPrisma } = require('@real-estate/db-models');

const app = require('./app');
const config = require('./config');

const logger = createLogger({ service: 'user-interactions-service' });

async function start() {
  try {
    // Connect to database
    await connectPrisma();
    logger.info('Connected to PostgreSQL');

    // Start server
    app.listen(config.port, () => {
      logger.info(`User Interactions Service listening on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start service:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

start();
