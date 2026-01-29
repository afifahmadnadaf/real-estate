'use strict';

module.exports = {
  port: parseInt(process.env.USER_SERVICE_PORT, 10) || 3001,
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

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_must_be_at_least_32_characters_long',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
    issuer: process.env.JWT_ISSUER || 'real-estate-platform',
    audience: process.env.JWT_AUDIENCE || 'real-estate-api',
  },

  // OTP
  otp: {
    length: parseInt(process.env.OTP_LENGTH, 10) || 6,
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10,
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5,
    rateLimitPerHour: parseInt(process.env.OTP_RATE_LIMIT_PER_HOUR, 10) || 5,
  },

  // Session
  session: {
    maxPerUser: 5,
    inactivityTimeoutDays: 30,
  },

  // SMS Provider
  sms: {
    provider: process.env.SMS_PROVIDER || 'dummy',
    apiKey: process.env.SMS_API_KEY,
    apiSecret: process.env.SMS_API_SECRET,
    senderId: process.env.SMS_SENDER_ID || 'REALTY',
  },

  // Kafka
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'user-service',
  },
};
