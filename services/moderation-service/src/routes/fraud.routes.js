'use strict';

const express = require('express');

const fraudController = require('../controllers/fraud.controller');

const router = express.Router();

router.get('/signals', fraudController.listSignals);
router.get('/score', fraudController.getScore);
router.post('/score/recompute', fraudController.recomputeScore);

module.exports = router;
