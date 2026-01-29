'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const packageController = require('../controllers/package.controller');
const { validateCreatePackage, validateIdParam } = require('../validators/billing.validator');

const router = express.Router();

// Public routes
router.get('/', packageController.listPackages);
router.get('/:id', validateIdParam, packageController.getPackage);

function requireAdmin(req, res, next) {
  const role = req.user?.role || req.headers['x-user-role'];
  if (role !== 'ADMIN') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Admin access required', traceId: req.traceId },
    });
  }
  next();
}

// Admin routes (spec: /v1/packages for create/update/delete)
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateCreatePackage,
  packageController.createPackage
);
router.patch('/:id', authenticate, requireAdmin, validateIdParam, packageController.updatePackage);
router.delete('/:id', authenticate, requireAdmin, validateIdParam, packageController.deletePackage);

// Backward-compatible admin routes
router.use('/admin', authenticate, requireAdmin);
router.post('/admin', validateCreatePackage, packageController.createPackage);
router.patch('/admin/:id', validateIdParam, packageController.updatePackage);
router.delete('/admin/:id', validateIdParam, packageController.deletePackage);

module.exports = router;
