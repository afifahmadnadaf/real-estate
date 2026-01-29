'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const priceAlertController = require('../controllers/price-alert.controller');
const {
  validateIdParam,
  validateCreatePriceAlert,
  validateUpdatePriceAlert,
} = require('../validators/user-interactions.validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', priceAlertController.listPriceAlerts);
router.post('/', validateCreatePriceAlert, priceAlertController.createPriceAlert);
router.patch(
  '/:id',
  validateIdParam,
  validateUpdatePriceAlert,
  priceAlertController.updatePriceAlert
);
router.delete('/:id', validateIdParam, priceAlertController.deletePriceAlert);

module.exports = router;
