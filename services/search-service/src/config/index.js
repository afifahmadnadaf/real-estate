'use strict';

module.exports = {
  port: parseInt(process.env.SEARCH_SERVICE_PORT, 10) || 3004,
  env: process.env.NODE_ENV || 'development',

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

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Search configuration
  search: {
    indexName: process.env.SEARCH_INDEX_NAME || 'properties',
    defaultLimit: parseInt(process.env.SEARCH_DEFAULT_LIMIT, 10) || 20,
    maxLimit: parseInt(process.env.SEARCH_MAX_LIMIT, 10) || 100,
    cacheTtl: parseInt(process.env.SEARCH_CACHE_TTL, 10) || 300, // 5 minutes
  },
};
