'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const moderationController = require('../controllers/moderation.controller');
const {
  validateTaskIdParam,
  validateQueueQuery,
  validateDecision,
  validateComment,
} = require('../validators/moderation.validator');

const router = express.Router();

// All routes require authentication (admin)
router.use(authenticate);

// Queue management
router.get('/queue', validateQueueQuery, moderationController.getQueue);
router.get('/queue/:taskId', validateTaskIdParam, moderationController.getTask);

// Task operations
router.post('/:taskId/claim', validateTaskIdParam, moderationController.claimTask);
router.post('/:taskId/release', validateTaskIdParam, moderationController.releaseTask);
router.post(
  '/:taskId/decision',
  validateTaskIdParam,
  validateDecision,
  moderationController.makeDecision
);
router.post(
  '/:taskId/comment',
  validateTaskIdParam,
  validateComment,
  moderationController.addComment
);

// Statistics
router.get('/stats', moderationController.getStats);

// Blacklist
router.get('/blacklist', moderationController.listBlacklist);

module.exports = router;
