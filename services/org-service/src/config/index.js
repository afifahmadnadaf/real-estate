'use strict';

module.exports = {
  port: parseInt(process.env.ORG_SERVICE_PORT, 10) || 3002,
  env: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL,
  },

  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'org-service',
  },

  invite: {
    expiryDays: 7,
  },

  kyc: {
    maxDocuments: 10,
    allowedTypes: ['PAN', 'GST', 'RERA', 'ADDRESS_PROOF', 'COMPANY_REGISTRATION'],
  },
};
