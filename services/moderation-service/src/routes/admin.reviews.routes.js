'use strict';

const express = require('express');

const reviewController = require('../controllers/review.controller');

const router = express.Router();

router.get('/queue', reviewController.adminQueue);
router.post('/:reviewId/decision', reviewController.adminDecision);

module.exports = router;
