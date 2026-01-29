'use strict';

const { redis } = require('@real-estate/db-models');

/**
 * Ingest event
 */
async function ingestEvent(event) {
  // Store event in database (simplified - in production would use time-series DB)
  // For now, we'll use Redis for real-time metrics and PostgreSQL for historical data

  const eventData = {
    eventType: event.type,
    userId: event.userId || null,
    sessionId: event.sessionId || null,
    properties: event.properties || {},
    timestamp: new Date(event.timestamp || Date.now()),
  };

  // Store in Redis for real-time metrics
  const key = `analytics:${event.type}:${new Date().toISOString().split('T')[0]}`;
  await redis.incr(key);
  await redis.expire(key, 86400 * 7); // 7 days

  // In production, would store in ClickHouse/TimescaleDB
  // For now, we'll use a simplified approach with PostgreSQL
  return eventData;
}

/**
 * Get KPIs
 */
async function getKPIs(_filters = {}) {
  // Get metrics from Redis (simplified - in production would aggregate from time-series DB)
  const metrics = {
    totalUsers: (await redis.get('analytics:users:total')) || 0,
    totalProperties: (await redis.get('analytics:properties:total')) || 0,
    totalLeads: (await redis.get('analytics:leads:total')) || 0,
    totalSearches: (await redis.get('analytics:searches:total')) || 0,
    totalPropertyViews: (await redis.get('analytics:property_views:total')) || 0,
    conversionRate: 0,
  };

  // Calculate conversion rate
  if (metrics.totalPropertyViews > 0) {
    metrics.conversionRate = ((metrics.totalLeads / metrics.totalPropertyViews) * 100).toFixed(2);
  }

  return metrics;
}

/**
 * Get funnel data
 */
async function getFunnel(funnelType, _filters = {}) {
  // Simplified funnel - in production would use proper funnel analysis
  const funnels = {
    property_listing: {
      steps: [
        { name: 'Property Created', count: 100 },
        { name: 'Submitted for Review', count: 80 },
        { name: 'Approved', count: 70 },
        { name: 'Published', count: 65 },
        { name: 'First View', count: 50 },
        { name: 'Lead Generated', count: 10 },
      ],
    },
    user_onboarding: {
      steps: [
        { name: 'Registered', count: 1000 },
        { name: 'Verified', count: 800 },
        { name: 'First Search', count: 600 },
        { name: 'Property View', count: 400 },
        { name: 'Lead Submit', count: 50 },
      ],
    },
  };

  return funnels[funnelType] || { steps: [] };
}

/**
 * Get cohort data
 */
async function getCohorts(cohortType, _filters = {}) {
  // Simplified cohort - in production would use proper cohort analysis
  return {
    cohorts: [
      {
        cohort: '2024-01',
        users: 100,
        retention: [100, 80, 70, 65, 60, 55, 50],
      },
      {
        cohort: '2024-02',
        users: 120,
        retention: [120, 100, 90, 85, 80, 75, 70],
      },
    ],
  };
}

/**
 * Get attribution data
 */
async function getAttribution(_filters = {}) {
  // Simplified attribution - in production would use proper attribution modeling
  return {
    channels: [
      { channel: 'organic', conversions: 100, revenue: 100000 },
      { channel: 'paid_search', conversions: 50, revenue: 50000 },
      { channel: 'social', conversions: 30, revenue: 30000 },
      { channel: 'direct', conversions: 20, revenue: 20000 },
    ],
  };
}

module.exports = {
  ingestEvent,
  getKPIs,
  getFunnel,
  getCohorts,
  getAttribution,
};
