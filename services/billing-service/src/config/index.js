'use strict';

module.exports = {
  port: parseInt(process.env.BILLING_SERVICE_PORT, 10) || 3008,
  env: process.env.NODE_ENV || 'development',

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // Razorpay
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
  payments: {
    provider: process.env.PAYMENT_PROVIDER || 'razorpay',
    localProviderUrl: process.env.LOCAL_PAYMENTS_URL || 'http://fake-payments:3099',
  },
  // Stripe
  stripe: {
    apiKey: process.env.STRIPE_API_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  // Kafka
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'billing-service',
  },

  // Invoice
  invoice: {
    prefix: process.env.INVOICE_PREFIX || 'INV',
    taxRate: parseFloat(process.env.TAX_RATE, 10) || 18, // 18% GST
  },

  // S3 (for Invoice Storage)
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_INVOICE_BUCKET || 'real-estate-invoices',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    cdnBaseUrl: process.env.CDN_BASE_URL,
  },
};
