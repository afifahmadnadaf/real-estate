'use strict';

module.exports = {
  port: parseInt(process.env.LEAD_SERVICE_PORT, 10) || 3006,
  env: process.env.NODE_ENV || 'development',

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // Kafka
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'lead-service',
  },
};
