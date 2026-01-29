'use strict';

const { httpStatus } = require('@real-estate/common');

const analyticsService = require('../services/analytics.service');

/**
 * Ingest event
 */
async function ingestEvent(req, res, next) {
  try {
    const event = {
      type: req.body.type,
      userId: req.body.userId,
      sessionId: req.body.sessionId,
      properties: req.body.properties,
      timestamp: req.body.timestamp,
    };

    await analyticsService.ingestEvent(event);

    res.status(httpStatus.CREATED).json({
      success: true,
      message: 'Event ingested successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Batch ingest events
 */
async function batchIngestEvents(req, res, next) {
  try {
    const events = req.body.events || [];

    await Promise.all(events.map((event) => analyticsService.ingestEvent(event)));

    res.status(httpStatus.CREATED).json({
      success: true,
      message: `${events.length} events ingested successfully`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  ingestEvent,
  batchIngestEvents,
};
