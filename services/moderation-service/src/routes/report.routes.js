'use strict';

const express = require('express');

const reportController = require('../controllers/report.controller');

const router = express.Router();

router.post('/', reportController.createReport);
router.get('/', reportController.listReports);
router.get('/:reportId', reportController.getReport);

module.exports = router;
