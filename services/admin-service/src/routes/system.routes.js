'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const systemController = require('../controllers/system.controller');

const router = express.Router();

// All routes require authentication (admin)
router.use(authenticate);

router.get('/status', systemController.getSystemStatus);
router.get('/stats', systemController.getSystemStats);
router.get('/dependencies', systemController.getDependencies);

module.exports = router;
