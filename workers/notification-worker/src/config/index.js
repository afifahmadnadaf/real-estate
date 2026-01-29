'use strict';

module.exports = {
  env: process.env.NODE_ENV || 'development',

  // Kafka
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'notification-worker',
    groupId: process.env.KAFKA_GROUP_ID || 'notification-worker-group',
  },

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // Notification providers (placeholders - integrate with actual providers)
  providers: {
    sms: {
      provider: process.env.SMS_PROVIDER || 'twilio',
      apiKey: process.env.SMS_API_KEY,
      apiSecret: process.env.SMS_API_SECRET,
    },
    email: {
      provider: process.env.EMAIL_PROVIDER || 'sendgrid',
      apiKey: process.env.EMAIL_API_KEY,
      fromEmail: process.env.EMAIL_FROM || 'noreply@realestate.com',
    },
    push: {
      provider: process.env.PUSH_PROVIDER || 'fcm',
      apiKey: process.env.PUSH_API_KEY,
    },
    whatsapp: {
      provider: process.env.WHATSAPP_PROVIDER || 'twilio',
      apiKey: process.env.WHATSAPP_API_KEY,
      apiSecret: process.env.WHATSAPP_API_SECRET,
    },
  },
};
