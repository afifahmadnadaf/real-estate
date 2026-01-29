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
const analyticsRoutes = require('./routes/analytics.routes');

const logger = createLogger({ service: 'analytics-service' });

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
  res.json({ status: 'healthy', service: 'analytics-service' });
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
app.use('/v1/events', analyticsRoutes);
app.use('/v1/admin/analytics', require('./routes/admin.routes'));

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app;
