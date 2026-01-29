'use strict';

require('dotenv').config();

const { createLogger } = require('@real-estate/common');

const app = require('./app');

const logger = createLogger({ service: 'api-gateway' });
const PORT = process.env.API_GATEWAY_PORT || 3000;

// Start server
const server = app.listen(PORT, () => {
  logger.info(`API Gateway started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async (err) => {
    if (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }

    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = server;
