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
const searchRoutes = require('./routes/search.routes');

const logger = createLogger({ service: 'search-service' });

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
  res.json({ status: 'healthy', service: 'search-service' });
});

app.get('/metrics', metricsHandler());

app.get('/ready', async (req, res) => {
  // Check Elasticsearch connection
  const { getElasticsearchClient } = require('./services/elasticsearch.service');
  const esClient = getElasticsearchClient();

  const checks = {
    elasticsearch: false,
  };

  try {
    const health = await esClient.cluster.health();
    checks.elasticsearch = health.status !== 'red';
  } catch (error) {
    logger.error({ error }, 'Elasticsearch health check failed');
  }

  const allHealthy = Object.values(checks).every(Boolean);
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not_ready',
    checks,
  });
});

// Routes
app.use('/v1/search', searchRoutes);
app.use('/internal/v1', internalRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app;
