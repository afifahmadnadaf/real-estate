'use strict';

require('dotenv').config();

const { createLogger } = require('@real-estate/common');

const app = require('./app');
const config = require('./config');

const logger = createLogger({ service: 'search-service' });

async function start() {
  try {
    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Search Service listening on port ${config.port}`);
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
