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
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

const logger = createLogger({ service: 'user-service' });

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
  res.json({ status: 'healthy', service: 'user-service' });
});

app.get('/metrics', metricsHandler());

app.get('/ready', async (req, res) => {
  // Check dependencies
  const redis = app.get('redis');
  const checks = {
    redis: redis?.status === 'ready',
  };

  const allHealthy = Object.values(checks).every(Boolean);
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not_ready',
    checks,
  });
});

// Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/users', userRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app;
