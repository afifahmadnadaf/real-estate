'use strict';

const express = require('express');

const webhookController = require('../controllers/webhook.controller');

const router = express.Router();

// Partner lead webhook (no auth; signature/token verified)
router.post(
  '/partner/leads',
  express.raw({ type: 'application/json' }),
  webhookController.partnerLeadWebhook
);

module.exports = router;
