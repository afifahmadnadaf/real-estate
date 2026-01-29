'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const propertyController = require('../controllers/property.controller');
const {
  validateCreateProperty,
  validateUpdateProperty,
  validateListProperties,
  validateIdParam,
  validateMediaIdParam,
  validateDocumentIdParam,
  validateAttachMedia,
  validateReorderMedia,
  validateAttachDocument,
  validateBatchFetch,
} = require('../validators/property.validator');

const router = express.Router();

// Public routes
router.get('/', validateListProperties, propertyController.listProperties);
router.get('/:id', validateIdParam, propertyController.getProperty);

// Protected routes (require authentication)
router.use(authenticate);

// CRUD operations
router.post('/', validateCreateProperty, propertyController.createProperty);
router.patch('/:id', validateIdParam, validateUpdateProperty, propertyController.updateProperty);
router.delete('/:id', validateIdParam, propertyController.deleteProperty);

// List my properties
router.get('/me/list', validateListProperties, propertyController.listMyProperties);

// Lifecycle operations
router.post('/:id/submit', validateIdParam, propertyController.submitProperty);
router.post('/:id/resubmit', validateIdParam, propertyController.resubmitProperty);
router.post('/:id/unpublish', validateIdParam, propertyController.unpublishProperty);
router.post('/:id/archive', validateIdParam, propertyController.archiveProperty);
router.post('/:id/restore', validateIdParam, propertyController.restoreProperty);
router.post('/:id/mark-sold', validateIdParam, propertyController.markSold);
router.post('/:id/mark-rented', validateIdParam, propertyController.markRented);
router.post('/:id/refresh', validateIdParam, propertyController.refreshProperty);

// Version history
router.get('/:id/versions', validateIdParam, propertyController.getVersionHistory);
router.get('/:id/audit', validateIdParam, propertyController.getAudit);

// Media management
router.post('/:id/media', validateIdParam, validateAttachMedia, propertyController.attachMedia);
router.patch(
  '/:id/media/order',
  validateIdParam,
  validateReorderMedia,
  propertyController.reorderMedia
);
router.delete('/:id/media/:mediaId', validateMediaIdParam, propertyController.detachMedia);

// Document management
router.post(
  '/:id/documents',
  validateIdParam,
  validateAttachDocument,
  propertyController.attachDocument
);
router.delete('/:id/documents/:docId', validateDocumentIdParam, propertyController.removeDocument);

// Utility endpoints
router.get('/:id/similar', validateIdParam, propertyController.getSimilarProperties);
router.post('/:id/duplicate/check', validateIdParam, propertyController.checkDuplicate);
router.post('/batch', validateBatchFetch, propertyController.batchFetchProperties);
router.get('/:id/contact-options', validateIdParam, propertyController.getContactOptions);

// Admin routes (will be protected by admin middleware in API Gateway)
router.post('/:id/publish', validateIdParam, propertyController.publishProperty);
router.post('/:id/expire', validateIdParam, propertyController.expireProperty);

module.exports = router;
