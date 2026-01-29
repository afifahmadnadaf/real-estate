'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const projectController = require('../controllers/project.controller');

const router = express.Router();

router.use(authenticate);

router.post('/', projectController.createProject);
router.get('/', projectController.listProjects);
router.get('/:projectId', projectController.getProject);
router.patch('/:projectId', projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);

router.post('/:projectId/submit', projectController.submitProject);
router.post('/:projectId/publish', projectController.publishProject);

router.post('/:projectId/media', projectController.attachMedia);
router.patch('/:projectId/media/order', projectController.reorderMedia);
router.delete('/:projectId/media/:mediaId', projectController.detachMedia);
router.post('/:projectId/brochure', projectController.uploadBrochure);

router.post('/:projectId/inventory/units', projectController.addUnit);
router.get('/:projectId/inventory/units', projectController.listUnits);
router.get('/:projectId/inventory/units/:unitId', projectController.getUnit);
router.patch('/:projectId/inventory/units/:unitId', projectController.updateUnit);
router.delete('/:projectId/inventory/units/:unitId', projectController.deleteUnit);

router.post('/:projectId/inventory/import', projectController.startInventoryImport);
router.get('/:projectId/inventory/import/:jobId', projectController.getInventoryImportJob);

module.exports = router;
