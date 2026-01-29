'use strict';

const { createLogger } = require('@real-estate/common');
const { redis } = require('@real-estate/db-models');

const analyticsService = require('../services/analytics.service');

const logger = createLogger({ service: 'analytics-service' });

/**
 * Handle page view event
 */
async function handlePageView(event) {
  try {
    await analyticsService.ingestEvent(event);
    await redis.incr('analytics:page_views:total');
    logger.info({ event }, 'Processed page view event');
  } catch (error) {
    logger.error({ error, event }, 'Error handling page view');
  }
}

/**
 * Handle search event
 */
async function handleSearch(event) {
  try {
    await analyticsService.ingestEvent(event);
    await redis.incr('analytics:searches:total');
    logger.info({ event }, 'Processed search event');
  } catch (error) {
    logger.error({ error, event }, 'Error handling search');
  }
}

/**
 * Handle property view event
 */
async function handlePropertyView(event) {
  try {
    await analyticsService.ingestEvent(event);
    await redis.incr('analytics:property_views:total');
    logger.info({ event }, 'Processed property view event');
  } catch (error) {
    logger.error({ error, event }, 'Error handling property view');
  }
}

/**
 * Handle lead submit event
 */
async function handleLeadSubmit(event) {
  try {
    await analyticsService.ingestEvent(event);
    await redis.incr('analytics:leads:total');
    logger.info({ event }, 'Processed lead submit event');
  } catch (error) {
    logger.error({ error, event }, 'Error handling lead submit');
  }
}

module.exports = {
  handlePageView,
  handleSearch,
  handlePropertyView,
  handleLeadSubmit,
};
