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
const adminContentRoutes = require('./routes/admin.content.routes');
const adminBulkRoutes = require('./routes/admin.bulk.routes');
const adminBotRoutes = require('./routes/admin.bot.routes');
const adminExperimentsRoutes = require('./routes/admin.experiments.routes');
const adminFeatureFlagsRoutes = require('./routes/admin.feature-flags.routes');
const adminMetaRoutes = require('./routes/admin.meta.routes');
const adminRateLimitsRoutes = require('./routes/admin.rate-limits.routes');
const adminSupportRoutes = require('./routes/admin.support.routes');
const adminRoutes = require('./routes/admin.routes');
const auditRoutes = require('./routes/audit.routes');
const contentRoutes = require('./routes/content.routes');
const experimentsRoutes = require('./routes/experiments.routes');
const internalRoutes = require('./routes/internal.routes');
const metaRoutes = require('./routes/meta.routes');
const seoRoutes = require('./routes/seo.routes');
const supportRoutes = require('./routes/support.routes');
const systemRoutes = require('./routes/system.routes');

const logger = createLogger({ service: 'admin-service' });

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
  res.json({ status: 'healthy', service: 'admin-service' });
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
app.use('/v1/admin', adminRoutes);
app.use('/v1/admin/audit', auditRoutes);
app.use('/v1/admin/content', adminContentRoutes);
app.use('/v1/admin/bulk', adminBulkRoutes);
app.use('/v1/admin/bot', adminBotRoutes);
app.use('/v1/admin/meta', adminMetaRoutes);
app.use('/v1/admin/feature-flags', adminFeatureFlagsRoutes);
app.use('/v1/admin/experiments', adminExperimentsRoutes);
app.use('/v1/admin/rate-limits', adminRateLimitsRoutes);
app.use('/v1/admin/support', adminSupportRoutes);
app.use('/v1/admin/system', systemRoutes);
app.use('/internal/v1', internalRoutes);
app.use('/v1/content', contentRoutes);
app.use('/v1/seo', seoRoutes);
app.use('/v1/meta', metaRoutes);
app.use('/v1/experiments', experimentsRoutes);
app.use('/v1/support', supportRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app;
