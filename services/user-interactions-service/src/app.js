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

const priceAlertRoutes = require('./routes/price-alert.routes');
const savedSearchRoutes = require('./routes/saved-search.routes');
const shortlistRoutes = require('./routes/shortlist.routes');

const logger = createLogger({ service: 'user-interactions-service' });

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
  res.json({ status: 'healthy', service: 'user-interactions-service' });
});

app.get('/metrics', metricsHandler());

app.get('/ready', async (req, res) => {
  // Check database
  const { prisma } = require('@real-estate/db-models');
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ready',
      checks: {
        database: true,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      checks: {
        database: false,
      },
    });
  }
});

// Routes
app.use('/v1/shortlists', shortlistRoutes);
app.use('/v1/saved-searches', savedSearchRoutes);
app.use('/v1/alerts/price', priceAlertRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app;
