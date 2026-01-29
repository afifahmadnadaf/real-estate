'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const shortlistController = require('../controllers/shortlist.controller');
const {
  validateIdParam,
  validateAddToShortlist,
  validateBulkUpdateShortlist,
} = require('../validators/user-interactions.validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', shortlistController.listShortlists);
router.post('/', validateAddToShortlist, shortlistController.addToShortlist);
router.delete('/:id', validateIdParam, shortlistController.removeFromShortlist);
router.post('/bulk', validateBulkUpdateShortlist, shortlistController.bulkUpdateShortlist);

module.exports = router;
