'use strict';

const {
  errorHandler,
  notFoundHandler,
  requestLogger,
  traceIdMiddleware,
  createLogger,
  metricsMiddleware,
  metricsHandler,
} = require('@real-estate/common');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');

const _config = require('./config');
const adminWebhookRoutes = require('./routes/admin.webhooks.routes');
const couponRoutes = require('./routes/coupon.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const packageRoutes = require('./routes/package.routes');
const paymentRoutes = require('./routes/payment.routes');
const refundRoutes = require('./routes/refund.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const webhookRoutes = require('./routes/webhook.routes');

const logger = createLogger({ service: 'billing-service' });

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trace ID
app.use(traceIdMiddleware());

// Request logging
app.use(requestLogger({ logger }));
app.use(metricsMiddleware());

// Health checks
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'billing-service' });
});

app.get('/metrics', metricsHandler());

app.get('/ready', async (req, res) => {
  // Check database
  const { prisma } = require('@real-estate/db-models');
  const checks = {
    database: true,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    checks.database = false;
  }

  const allHealthy = Object.values(checks).every(Boolean);
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not_ready',
    checks,
  });
});

// Routes
app.use('/v1/packages', packageRoutes);
app.use('/v1/subscriptions', subscriptionRoutes);
app.use('/v1/payments', paymentRoutes);
app.use('/v1/invoices', invoiceRoutes);
app.use('/v1/refunds', refundRoutes);
app.use('/v1/webhooks', webhookRoutes);
app.use('/v1/coupons', couponRoutes);
app.use('/v1/admin/webhooks', adminWebhookRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app;
