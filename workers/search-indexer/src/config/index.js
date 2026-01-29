'use strict';

module.exports = {
  env: process.env.NODE_ENV || 'development',

  // MongoDB
  mongo: {
    url: process.env.MONGO_URL || 'mongodb://localhost:27017/real_estate',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // Elasticsearch
  elasticsearch: {
    node: process.env.ELASTICSEARCH_HOST || 'http://localhost:9200',
    auth:
      process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD
        ? {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD,
          }
        : undefined,
    tls: process.env.ELASTICSEARCH_TLS === 'true' ? { rejectUnauthorized: false } : undefined,
  },

  // Kafka
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'search-indexer-worker',
    groupId: process.env.KAFKA_GROUP_ID || 'search-indexer-group',
  },
};
