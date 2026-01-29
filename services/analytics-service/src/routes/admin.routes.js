'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const adminController = require('../controllers/admin.controller');

const router = express.Router();

// All routes require authentication (admin)
router.use(authenticate);

router.get('/kpis', adminController.getKPIs);
router.get('/funnels', adminController.getFunnel);
router.get('/cohorts', adminController.getCohorts);
router.get('/attribution', adminController.getAttribution);

module.exports = router;
