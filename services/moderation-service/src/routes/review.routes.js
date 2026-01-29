'use strict';

const express = require('express');

const reviewController = require('../controllers/review.controller');

const router = express.Router();

router.post('/', reviewController.createReview);
router.get('/', reviewController.listReviews);
router.get('/:reviewId', reviewController.getReview);
router.patch('/:reviewId', reviewController.updateReview);
router.delete('/:reviewId', reviewController.deleteReview);

module.exports = router;
