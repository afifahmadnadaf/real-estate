'use strict';

const { optionalAuth } = require('@real-estate/common');
const express = require('express');

const experimentsController = require('../controllers/experiments.controller');

const router = express.Router();

router.use(optionalAuth());

router.get('/', experimentsController.listExperiments);
router.post('/exposure', experimentsController.logExposureUnified);
router.get('/:key/assignment', experimentsController.getAssignment);
router.post('/:key/exposures', experimentsController.logExposure);

module.exports = router;
