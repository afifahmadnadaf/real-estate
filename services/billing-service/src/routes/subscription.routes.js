'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const subscriptionController = require('../controllers/subscription.controller');
const {
  validateCreateSubscription,
  validateCancelSubscription,
  validateIdParam,
} = require('../validators/billing.validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', validateCreateSubscription, subscriptionController.createSubscription);
router.get('/', subscriptionController.listSubscriptions);
router.get('/:id', validateIdParam, subscriptionController.getSubscription);
router.post(
  '/:id/cancel',
  validateIdParam,
  validateCancelSubscription,
  subscriptionController.cancelSubscription
);

module.exports = router;
