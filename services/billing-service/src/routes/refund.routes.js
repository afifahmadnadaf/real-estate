'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const refundController = require('../controllers/refund.controller');
const { validateIdParam } = require('../validators/billing.validator');

const router = express.Router();
router.use(authenticate);

router.get('/', refundController.listRefunds);
router.get('/:id', validateIdParam, refundController.getRefund);

module.exports = router;
