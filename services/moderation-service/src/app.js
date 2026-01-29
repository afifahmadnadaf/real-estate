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
const adminReportRoutes = require('./routes/admin.reports.routes');
const adminReviewRoutes = require('./routes/admin.reviews.routes');
const blacklistRoutes = require('./routes/blacklist.routes');
const fraudRoutes = require('./routes/fraud.routes');
const moderationRoutes = require('./routes/moderation.routes');
const reportRoutes = require('./routes/report.routes');
const reviewRoutes = require('./routes/review.routes');
const rulesRoutes = require('./routes/rules.routes');

const logger = createLogger({ service: 'moderation-service' });

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
  res.json({ status: 'healthy', service: 'moderation-service' });
});

app.get('/metrics', metricsHandler());

app.get('/ready', async (req, res) => {
  // Check dependencies
  const { prisma } = require('@real-estate/db-models');
  const checks = {
    database: true, // Prisma handles connection pooling
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
app.use('/v1/admin/moderation', moderationRoutes);
app.use('/v1/admin/moderation/rules', rulesRoutes);
app.use('/v1/reports', reportRoutes);
app.use('/v1/reviews', reviewRoutes);
app.use('/v1/admin/reports', adminReportRoutes);
app.use('/v1/admin/reviews', adminReviewRoutes);
app.use('/v1/admin/blacklist', blacklistRoutes);
app.use('/v1/admin/fraud', fraudRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app;
