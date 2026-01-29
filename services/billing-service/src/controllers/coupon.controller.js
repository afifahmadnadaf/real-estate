'use strict';

const { httpStatus } = require('@real-estate/common');

const couponService = require('../services/coupon.service');

/**
 * List coupons
 */
async function listCoupons(req, res, next) {
  try {
    const filters = {
      isActive: req.query.isActive,
    };
    const coupons = await couponService.listCoupons(filters);
    res.status(httpStatus.OK).json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Validate coupon
 */
async function validateCoupon(req, res, next) {
  try {
    const { code, amount, packageId } = req.body;
    const result = await couponService.validateCoupon(code, amount, packageId);
    res.status(httpStatus.OK).json({
      success: result.valid,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create coupon (admin)
 */
async function createCoupon(req, res, next) {
  try {
    const coupon = await couponService.createCoupon(req.body);
    res.status(httpStatus.CREATED).json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update coupon (admin)
 */
async function updateCoupon(req, res, next) {
  try {
    const { couponId } = req.params;
    const coupon = await couponService.updateCoupon(couponId, req.body);
    res.status(httpStatus.OK).json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete coupon (admin)
 */
async function deleteCoupon(req, res, next) {
  try {
    const { couponId } = req.params;
    await couponService.deleteCoupon(couponId);
    res.status(httpStatus.OK).json({
      success: true,
      message: 'Coupon deleted',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
