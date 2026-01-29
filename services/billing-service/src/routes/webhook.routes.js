'use strict';

const express = require('express');

const webhookController = require('../controllers/webhook.controller');

const router = express.Router();

// Webhook routes (no auth, signature verified)
router.post(
  '/razorpay',
  express.raw({ type: 'application/json' }),
  webhookController.razorpayWebhook
);
router.post('/stripe', express.raw({ type: 'application/json' }), webhookController.stripeWebhook);
router.post(
  '/shiprocket',
  express.raw({ type: 'application/json' }),
  webhookController.shiprocketWebhook
);

module.exports = router;
