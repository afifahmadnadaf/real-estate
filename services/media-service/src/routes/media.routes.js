'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const mediaController = require('../controllers/media.controller');
const {
  validatePresign,
  validateCompleteUpload,
  validateIdParam,
  validateListMedia,
  validateUsage,
  validateOverrideModeration,
} = require('../validators/media.validator');

const router = express.Router();

// Public route (for CDN access)
router.get('/:id', validateIdParam, mediaController.getMedia);
router.get('/:id/renditions', validateIdParam, mediaController.getRenditions);

// Protected routes (require authentication)
router.use(authenticate);

function requireAdmin(req, res, next) {
  const role = req.user?.role || req.headers['x-user-role'];
  if (role !== 'ADMIN') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Admin access required', traceId: req.traceId },
    });
  }
  next();
}

// Upload operations
router.post('/presign', validatePresign, mediaController.generatePresignedUrl);
router.post('/complete', validateCompleteUpload, mediaController.completeUpload);

// Media management
router.get('/', validateListMedia, mediaController.listMedia);
router.delete('/:id', validateIdParam, mediaController.deleteMedia);

// Usage tracking
router.post('/:id/usage', validateIdParam, validateUsage, mediaController.addUsage);
router.delete('/:id/usage', validateIdParam, validateUsage, mediaController.removeUsage);

// Admin routes (protected by admin middleware in API Gateway)
router.post('/:id/reprocess', requireAdmin, validateIdParam, mediaController.reprocessMedia);
router.post('/admin/:id/reprocess', validateIdParam, mediaController.reprocessMedia);
router.get('/admin/failed', mediaController.getFailedJobs);
router.post(
  '/admin/:id/override',
  validateIdParam,
  validateOverrideModeration,
  mediaController.overrideModeration
);

module.exports = router;
