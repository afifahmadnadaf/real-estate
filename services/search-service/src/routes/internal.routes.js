'use strict';

const { internalAuth, httpStatus } = require('@real-estate/common');
const express = require('express');

const es = require('../services/elasticsearch.service');

const router = express.Router();

router.use(internalAuth());

router.post('/search/index', async (req, res, next) => {
  try {
    const { index = 'properties', id, doc, op = 'upsert' } = req.body || {};
    if (!id) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, error: 'id required' });
    }
    if (op === 'delete') {
      await es.deleteProperty(id);
      return res.json({ accepted: true });
    }
    if (!doc) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, error: 'doc required' });
    }
    // Ensure index exists; index property doc
    await es.ensureIndex();
    await es.getElasticsearchClient().index({ index: index || 'properties', id, body: doc });
    return res.json({ accepted: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
