'use strict';

const express = require('express');

const contentController = require('../controllers/content.controller');

const router = express.Router();

router.get('/landing/cities', contentController.listSeoCities);
router.get('/landing/city/:citySlug', contentController.getSeoCity);
router.get('/landing/locality/:localitySlug', contentController.getSeoLocality);

module.exports = router;
