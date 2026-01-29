'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const notificationController = require('../controllers/notification.controller');
const { validateIdParam } = require('../validators/notification.validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', notificationController.listNotifications);
router.get('/:id', validateIdParam, notificationController.getNotification);
router.patch('/:id', validateIdParam, notificationController.markAsRead);
router.post('/mark-all-read', notificationController.markAllAsRead);

module.exports = router;
