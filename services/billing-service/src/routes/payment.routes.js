'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const paymentController = require('../controllers/payment.controller');
const {
  validateInitiatePayment,
  validateCreateRefund,
  validateIdParam,
} = require('../validators/billing.validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/initiate', validateInitiatePayment, paymentController.initiatePayment);
router.get('/', paymentController.listPayments);
router.post('/:id/retry', validateIdParam, paymentController.retryPayment);
router.get('/:id', validateIdParam, paymentController.getPayment);
router.post('/:id/refund', validateIdParam, validateCreateRefund, paymentController.createRefund);

module.exports = router;
