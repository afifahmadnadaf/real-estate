'use strict';

module.exports = {
  port: parseInt(process.env.MODERATION_SERVICE_PORT, 10) || 3007,
  env: process.env.NODE_ENV || 'development',

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Kafka
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'moderation-service',
  },

  // Moderation configuration
  moderation: {
    autoApproveThreshold: parseFloat(process.env.AUTO_APPROVE_THRESHOLD, 10) || 80,
    autoRejectThreshold: parseFloat(process.env.AUTO_REJECT_THRESHOLD, 10) || 30,
    maxClaimTimeoutMinutes: parseInt(process.env.MAX_CLAIM_TIMEOUT_MINUTES, 10) || 30,
  },
};
