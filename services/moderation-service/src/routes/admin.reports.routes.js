'use strict';

const express = require('express');

const reportController = require('../controllers/report.controller');

const router = express.Router();

router.get('/queue', reportController.adminQueue);
router.post('/:reportId/decision', reportController.adminDecision);

module.exports = router;
