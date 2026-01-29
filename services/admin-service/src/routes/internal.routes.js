'use strict';

const { internalAuth } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');
const express = require('express');

const router = express.Router();
router.use(internalAuth());

router.get('/config', async (req, res, next) => {
  try {
    const key = req.query.key;
    if (key) {
      const item = await prisma.runtimeConfig.findUnique({ where: { key: String(key) } });
      return res.json({ key: String(key), value: item?.value });
    }
    const all = await prisma.runtimeConfig.findMany({ orderBy: { updatedAt: 'desc' } });
    const out = all.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
    res.json(out);
  } catch (error) {
    next(error);
  }
});

router.post('/config', async (req, res, next) => {
  try {
    const entries = req.body || {};
    const keys = Object.keys(entries);
    for (const key of keys) {
      await prisma.runtimeConfig.upsert({
        where: { key },
        update: { value: entries[key] },
        create: { key, value: entries[key] },
      });
    }
    res.json({ success: true, updatedKeys: keys });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
