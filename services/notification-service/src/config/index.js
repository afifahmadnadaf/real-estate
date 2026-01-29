'use strict';

module.exports = {
  port: parseInt(process.env.NOTIFICATION_SERVICE_PORT, 10) || 3009,
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
    clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
  },

  // Notification providers (placeholders - integrate with actual providers)
  providers: {
    sms: {
      provider: process.env.SMS_PROVIDER || 'twilio', // twilio, msg91, etc.
      apiKey: process.env.SMS_API_KEY,
      apiSecret: process.env.SMS_API_SECRET,
    },
    email: {
      provider: process.env.EMAIL_PROVIDER || 'sendgrid', // sendgrid, ses, etc.
      apiKey: process.env.EMAIL_API_KEY,
      fromEmail: process.env.EMAIL_FROM || 'noreply@realestate.com',
    },
    push: {
      provider: process.env.PUSH_PROVIDER || 'fcm', // fcm, apns, etc.
      apiKey: process.env.PUSH_API_KEY,
    },
    whatsapp: {
      provider: process.env.WHATSAPP_PROVIDER || 'twilio', // twilio, etc.
      apiKey: process.env.WHATSAPP_API_KEY,
      apiSecret: process.env.WHATSAPP_API_SECRET,
    },
  },
};
