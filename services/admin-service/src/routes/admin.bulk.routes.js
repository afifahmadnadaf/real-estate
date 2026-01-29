'use strict';

const { authMiddleware } = require('@real-estate/common');
const express = require('express');

const bulkController = require('../controllers/bulk.controller');

const router = express.Router();
router.use(authMiddleware({ roles: ['ADMIN'] }));

router.post('/import/properties', bulkController.importProperties);
router.post('/import/projects', bulkController.importProjects);
router.post('/export/properties', bulkController.exportProperties);
router.get('/export/:exportId', bulkController.getExportStatus);

router.get('/jobs', bulkController.listJobs);
router.get('/jobs/:jobId', bulkController.getJob);
router.get('/jobs/:jobId/errors', bulkController.getErrors);

module.exports = router;

