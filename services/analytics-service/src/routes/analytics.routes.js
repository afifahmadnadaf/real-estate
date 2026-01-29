'use strict';

const express = require('express');

const analyticsController = require('../controllers/analytics.controller');
const { validateIngestEvent, validateBatchIngest } = require('../validators/analytics.validator');

const router = express.Router();

// Public routes (for client-side tracking)
router.post('/', validateIngestEvent, analyticsController.ingestEvent);
router.post('/batch', validateBatchIngest, analyticsController.batchIngestEvents);

module.exports = router;
