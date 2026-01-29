'use strict';

const { authMiddleware, httpStatus } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');
const { createProducer, TOPICS } = require('@real-estate/events');
const express = require('express');

const router = express.Router();

// Require admin auth via gateway role guard
router.use(authMiddleware({ roles: ['ADMIN', 'SUPER_ADMIN'] }));

router.get('/logs', async (req, res, next) => {
  try {
    const events = await prisma.webhookEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(events);
  } catch (error) {
    next(error);
  }
});

router.post('/replay', async (req, res, next) => {
  try {
    const { eventId } = req.body || {};
    if (!eventId) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, error: 'eventId required' });
    }
    const event = await prisma.webhookEvent.findUnique({ where: { eventId } });
    if (!event) {
      return res.status(httpStatus.NOT_FOUND).json({ success: false, error: 'event not found' });
    }
    const producer = createProducer({ service: 'billing-service' });
    await producer.connect();
    await producer.publish(
      TOPICS.BILLING,
      'webhook.replayed',
      {
        eventId,
        provider: event.provider,
        rawBody: event.rawBody,
        replayedAt: new Date().toISOString(),
      },
      { key: eventId }
    );
    await producer.disconnect();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
