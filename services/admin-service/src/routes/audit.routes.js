'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const auditController = require('../controllers/audit.controller');
const { validateIdParam } = require('../validators/admin.validator');

const router = express.Router();

// All routes require authentication (admin)
router.use(authenticate);

router.get('/', auditController.listAuditLogs);
router.get('/:id', validateIdParam, auditController.getAuditLog);
router.post('/export', auditController.exportAuditLogs);

module.exports = router;
