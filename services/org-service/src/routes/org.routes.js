'use strict';

const { validateBody } = require('@real-estate/common');
const express = require('express');

const orgController = require('../controllers/org.controller');
const orgValidator = require('../validators/org.validator');

const router = express.Router();

// Create organization
router.post('/', validateBody(orgValidator.createOrgSchema), orgController.createOrg);

// List organizations (user's orgs or admin list)
router.get('/', orgController.listOrgs);

// Get organization
router.get('/:orgId', orgController.getOrg);

// Update organization
router.patch('/:orgId', validateBody(orgValidator.updateOrgSchema), orgController.updateOrg);

// Logo upload
router.post('/:orgId/logo', validateBody(orgValidator.uploadLogoSchema), orgController.uploadLogo);

// Admin verification endpoints
router.post('/:orgId/verification/approve', orgController.approveOrg);

router.post('/:orgId/verification/reject', orgController.rejectOrg);

router.post(
  '/:orgId/verification/request-changes',
  validateBody(orgValidator.requestChangesSchema),
  orgController.requestChanges
);

module.exports = router;
