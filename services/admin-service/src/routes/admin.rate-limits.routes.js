'use strict';

const { authMiddleware } = require('@real-estate/common');
const express = require('express');

const rateLimitsController = require('../controllers/rate-limits.controller');

const router = express.Router();
router.use(authMiddleware({ roles: ['ADMIN'] }));

router.get('/', rateLimitsController.getRateLimits);
router.patch('/', rateLimitsController.updateRateLimits);

module.exports = router;

