'use strict';

module.exports = {
  port: parseInt(process.env.ANALYTICS_SERVICE_PORT, 10) || 3011,
  env: process.env.NODE_ENV || 'development',

  // Database (using PostgreSQL for now, can be migrated to ClickHouse/TimescaleDB)
  database: {
    url: process.env.DATABASE_URL,
  },

  // Redis for caching
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Kafka
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'analytics-service',
  },
};
