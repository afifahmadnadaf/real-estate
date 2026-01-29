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
const compression = require('compression');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');

const config = require('./config');
const { authMiddleware: _authMiddleware } = require('./middleware/auth');
const { rateLimiter } = require('./middleware/rate-limit');
const routes = require('./routes');
const internalRoutes = require('./routes/internal.routes');

const logger = createLogger({ service: 'api-gateway' });

const app = express();

// Trust proxy (for getting real IP behind load balancer)
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for API
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: config.cors.origins,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Client-Version',
      'Idempotency-Key',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
  })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trace ID injection
app.use(traceIdMiddleware());

// Request logging
app.use(requestLogger({ logger }));
app.use(metricsMiddleware());

// Rate limiting
app.use(rateLimiter);

const Redis = require('ioredis');

async function checkRedis() {
  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
  });
  try {
    await client.connect();
    await client.ping();
    return true;
  } catch {
    return false;
  } finally {
    try {
      client.disconnect();
    } catch {
      void 0;
    }
  }
}

// Health check endpoints (before auth)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/ready', async (req, res) => {
  // Check Redis connection
  const redisConnected = await checkRedis();
  
  if (redisConnected) {
    res.json({ 
      status: 'ready', 
      timestamp: new Date().toISOString(),
      checks: {
        redis: 'ok'
      }
    });
  } else {
    res.status(503).json({ 
      status: 'not_ready', 
      timestamp: new Date().toISOString(),
      checks: {
        redis: 'failed'
      }
    });
  }
});

// Metrics endpoint (for Prometheus)
app.get('/metrics', metricsHandler());

app.use('/internal/v1', internalRoutes);

// API routes
app.use('/v1', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app;
