'use strict';

module.exports = {
  port: parseInt(process.env.PROPERTY_SERVICE_PORT, 10) || 3003,
  env: process.env.NODE_ENV || 'development',

  // MongoDB
  mongo: {
    url: process.env.MONGO_URL || 'mongodb://localhost:27017/real_estate',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // Redis (for caching)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Kafka
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'property-service',
  },

  // Property defaults
  property: {
    defaultExpiryDays: parseInt(process.env.PROPERTY_DEFAULT_EXPIRY_DAYS, 10) || 90,
    maxDraftAgeDays: parseInt(process.env.PROPERTY_MAX_DRAFT_AGE_DAYS, 10) || 30,
    autoArchiveDays: parseInt(process.env.PROPERTY_AUTO_ARCHIVE_DAYS, 10) || 180,
  },

  // Media Service
  mediaService: {
    url: process.env.MEDIA_SERVICE_URL || 'http://localhost:3005',
  },
};
