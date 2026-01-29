'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const savedSearchController = require('../controllers/saved-search.controller');
const {
  validateIdParam,
  validateCreateSavedSearch,
  validateUpdateSavedSearch,
} = require('../validators/user-interactions.validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', savedSearchController.listSavedSearches);
router.post('/', validateCreateSavedSearch, savedSearchController.createSavedSearch);
router.get('/:id', validateIdParam, savedSearchController.getSavedSearch);
router.patch(
  '/:id',
  validateIdParam,
  validateUpdateSavedSearch,
  savedSearchController.updateSavedSearch
);
router.delete('/:id', validateIdParam, savedSearchController.deleteSavedSearch);

module.exports = router;
