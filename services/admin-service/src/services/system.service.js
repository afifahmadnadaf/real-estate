'use strict';

const { prisma } = require('@real-estate/db-models');

/**
 * Get system status
 */
async function getSystemStatus() {
  const checks = {
    database: { status: 'unknown' },
    mongodb: { status: 'unknown' },
    redis: { status: 'unknown' },
    kafka: { status: 'unknown' },
  };

  // Check PostgreSQL
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'healthy' };
  } catch (error) {
    checks.database = { status: 'unhealthy', error: error.message };
  }

  // Check MongoDB
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      checks.mongodb = { status: 'healthy' };
    } else {
      checks.mongodb = { status: 'unhealthy', error: 'Not connected' };
    }
  } catch (error) {
    checks.mongodb = { status: 'unhealthy', error: error.message };
  }

  // Check Redis
  try {
    const { redis } = require('@real-estate/db-models');
    await redis.ping();
    checks.redis = { status: 'healthy' };
  } catch (error) {
    checks.redis = { status: 'unhealthy', error: error.message };
  }

  // Check Kafka (placeholder - would need actual Kafka client check)
  checks.kafka = { status: 'unknown', note: 'Kafka check not implemented' };

  const allHealthy = Object.values(checks).every((check) => check.status === 'healthy');

  return {
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  };
}

/**
 * Get system statistics
 */
async function getSystemStats() {
  const [userCount, propertyCount, leadCount, subscriptionCount, paymentCount] = await Promise.all([
    prisma.user.count(),
    prisma.$queryRaw`SELECT COUNT(*) as count FROM properties`.then((r) => r[0]?.count || 0),
    prisma.lead.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.payment.count({ where: { status: 'COMPLETED' } }),
  ]);

  return {
    users: {
      total: userCount,
    },
    properties: {
      total: propertyCount,
    },
    leads: {
      total: leadCount,
    },
    subscriptions: {
      active: subscriptionCount,
    },
    payments: {
      completed: paymentCount,
    },
  };
}

module.exports = {
  getSystemStatus,
  getSystemStats,
};
