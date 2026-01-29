'use strict';

const { internalAuth } = require('@real-estate/common');
const express = require('express');
const redis = require('redis');

const router = express.Router();
router.use(internalAuth());

let redisClient = null;
function getRedis() {
  if (!redisClient) {
    redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    redisClient.connect().catch(() => null);
  }
  return redisClient;
}

router.post('/cache/invalidate', async (req, res, next) => {
  try {
    const { keys = [], patterns = [] } = req.body || {};
    const client = getRedis();
    let invalidated = 0;

    for (const k of keys) {
      try {
        const result = await client.del(k);
        invalidated += result || 0;
      } catch (error) {
        invalidated += 0;
      }
    }

    for (const pattern of patterns) {
      try {
        const iter = client.scanIterator({ MATCH: pattern });
        for await (const key of iter) {
          const result = await client.del(key);
          invalidated += result || 0;
        }
      } catch (error) {
        invalidated += 0;
      }
    }

    res.json({ invalidated });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
