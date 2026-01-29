'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const couponController = require('../controllers/coupon.controller');
const {
  validateCoupon,
  validateCreateCoupon,
  validateUpdateCoupon,
} = require('../validators/billing.validator');

const router = express.Router();

// Public routes
router.get('/', couponController.listCoupons);
router.post('/validate', validateCoupon, couponController.validateCoupon);

function requireAdmin(req, res, next) {
  const role = req.user?.role || req.headers['x-user-role'];
  if (role !== 'ADMIN') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Admin access required', traceId: req.traceId },
    });
  }
  next();
}

// Admin routes (spec)
router.post('/', authenticate, requireAdmin, validateCreateCoupon, couponController.createCoupon);
router.patch(
  '/:couponId',
  authenticate,
  requireAdmin,
  validateUpdateCoupon,
  couponController.updateCoupon
);
router.delete('/:couponId', authenticate, requireAdmin, couponController.deleteCoupon);

module.exports = router;
