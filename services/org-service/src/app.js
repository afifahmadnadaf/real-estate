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

const kycRoutes = require('./routes/kyc.routes');
const memberRoutes = require('./routes/member.routes');
const orgRoutes = require('./routes/org.routes');
const teamRoutes = require('./routes/team.routes');

const logger = createLogger({ service: 'org-service' });

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(traceIdMiddleware());
app.use(requestLogger({ logger }));
app.use(metricsMiddleware());

// Health checks
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'org-service' });
});

app.get('/metrics', metricsHandler());

app.get('/ready', (req, res) => {
  res.json({ status: 'ready' });
});

// Routes
app.use('/v1/orgs', orgRoutes);
app.use('/v1/orgs', kycRoutes);
app.use('/v1/orgs', memberRoutes);
app.use('/v1/orgs', teamRoutes);

// Admin routes
app.use('/v1/admin/orgs', orgRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
