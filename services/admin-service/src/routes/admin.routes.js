'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const adminController = require('../controllers/admin.controller');
const { validateIdParam } = require('../validators/admin.validator');

const router = express.Router();

// All routes require authentication (admin)
router.use(authenticate);

router.get('/roles', adminController.listRoles);
router.get('/roles/:id', validateIdParam, adminController.getRole);
router.post('/roles', adminController.createRole);
router.patch('/roles/:id', validateIdParam, adminController.updateRole);
router.delete('/roles/:id', validateIdParam, adminController.deleteRole);

router.post('/roles/assign', adminController.assignRole);
router.post('/roles/revoke', adminController.revokeRole);
router.get('/users/:userId/roles', adminController.getUserRoles);
router.post('/users/:userId/roles', adminController.assignUserRole);
router.delete('/users/:userId/roles/:roleId', adminController.removeUserRole);
router.get('/permissions', adminController.listPermissions);

// Internal endpoints (for gateway/service-to-service checks)
router.post('/internal/permissions/check', adminController.checkPermission);

module.exports = router;
