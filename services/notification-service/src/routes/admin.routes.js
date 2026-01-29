'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const adminController = require('../controllers/admin.controller');
const { validateSendTest } = require('../validators/notification.validator');

const router = express.Router();

// All routes require authentication (admin)
router.use(authenticate);

router.get('/logs', adminController.listLogs);
router.post('/test', validateSendTest, adminController.sendTest);

module.exports = router;
