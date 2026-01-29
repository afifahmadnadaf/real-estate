'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const invoiceController = require('../controllers/invoice.controller');
const { validateIdParam } = require('../validators/billing.validator');

const router = express.Router();
router.use(authenticate);

router.get('/', invoiceController.listInvoices);
router.get('/:id', validateIdParam, invoiceController.getInvoice);

module.exports = router;
