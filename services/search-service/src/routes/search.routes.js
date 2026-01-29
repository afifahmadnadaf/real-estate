'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const searchController = require('../controllers/search.controller');
const {
  validateSearchQuery,
  validateMapSearchQuery,
  validateAutocompleteQuery,
  validateTaskIdParam,
} = require('../validators/search.validator');

const router = express.Router();

// Public routes
router.get('/properties', validateSearchQuery, searchController.searchProperties);
router.get('/map', validateMapSearchQuery, searchController.mapSearch);
router.get('/suggest', validateAutocompleteQuery, searchController.autocomplete);
router.get('/filters', searchController.getFilterMetadata);
router.get('/trending', searchController.getTrending);

// Protected routes (for user-specific features)
router.use(authenticate);
router.get('/recent', searchController.getRecent);
router.delete('/recent', searchController.clearRecent);

// Admin routes (protected by admin middleware in API Gateway)
router.post('/admin/reindex', searchController.triggerReindex);
router.get('/admin/reindex/:taskId', validateTaskIdParam, searchController.getReindexStatus);
router.get('/admin/index/health', searchController.getIndexHealth);

module.exports = router;
