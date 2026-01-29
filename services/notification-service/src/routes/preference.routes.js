'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const preferenceController = require('../controllers/preference.controller');
const { validateUpdatePreferences } = require('../validators/notification.validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', preferenceController.getPreferences);
router.patch('/', validateUpdatePreferences, preferenceController.updatePreferences);

module.exports = router;
