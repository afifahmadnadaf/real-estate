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
const internalRoutes = require('./routes/internal.routes');
const notificationRoutes = require('./routes/notification.routes');
const templateRoutes = require('./routes/template.routes');

const logger = createLogger({ service: 'notification-service' });

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
  res.json({ status: 'healthy', service: 'notification-service' });
});

app.get('/metrics', metricsHandler());

app.get('/ready', async (req, res) => {
  // Check database
  const { prisma } = require('@real-estate/db-models');
  const checks = {
    database: true,
    redis: true,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    checks.database = false;
  }

  try {
    const { redis } = require('@real-estate/db-models');
    await redis.ping();
  } catch {
    checks.redis = false;
  }

  const allHealthy = Object.values(checks).every(Boolean);
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not_ready',
    checks,
  });
});

// Routes
app.use('/v1/notifications', notificationRoutes);
app.use('/v1/notification-preferences', require('./routes/preference.routes'));
app.use('/v1/admin/notification-templates', templateRoutes);
app.use('/v1/admin/notifications', require('./routes/admin.routes'));
app.use('/internal/v1', internalRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app;
