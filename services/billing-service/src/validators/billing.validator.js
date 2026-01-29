'use strict';

const { validate } = require('@real-estate/common');
const Joi = require('joi');

// Create subscription schema
const createSubscriptionSchema = Joi.object({
  packageId: Joi.string().required(),
  orgId: Joi.string().optional(),
  autoRenew: Joi.boolean().default(true),
});

// Cancel subscription schema
const cancelSubscriptionSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
});

// Initiate payment schema
const initiatePaymentSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  currency: Joi.string().default('INR'),
  subscriptionId: Joi.string().optional(),
  couponCode: Joi.string().optional(),
  idempotencyKey: Joi.string().optional(),
});

// Create refund schema
const createRefundSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  reason: Joi.string().required().min(5).max(500),
});

// Validate coupon schema
const validateCouponSchema = Joi.object({
  code: Joi.string().required(),
  amount: Joi.number().min(0).required(),
  packageId: Joi.string().optional(),
});

// Create coupon schema (admin)
const createCouponSchema = Joi.object({
  code: Joi.string().required().min(2).max(50),
  description: Joi.string().max(1000).optional(),
  discountType: Joi.string().valid('PERCENTAGE', 'FIXED').required(),
  discountValue: Joi.number().min(0).required(),
  maxUses: Joi.number().integer().min(1).optional(),
  minAmount: Joi.number().min(0).optional(),
  maxDiscount: Joi.number().min(0).optional(),
  validFrom: Joi.date().required(),
  validUntil: Joi.date().required(),
  applicablePackages: Joi.array().items(Joi.string()).default([]),
  isActive: Joi.boolean().default(true),
});

// Update coupon schema (admin)
const updateCouponSchema = Joi.object({
  description: Joi.string().max(1000).optional(),
  discountType: Joi.string().valid('PERCENTAGE', 'FIXED').optional(),
  discountValue: Joi.number().min(0).optional(),
  maxUses: Joi.number().integer().min(1).allow(null).optional(),
  minAmount: Joi.number().min(0).allow(null).optional(),
  maxDiscount: Joi.number().min(0).allow(null).optional(),
  validFrom: Joi.date().optional(),
  validUntil: Joi.date().optional(),
  applicablePackages: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional(),
});

// Create package schema (admin)
const createPackageSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  slug: Joi.string().required(),
  type: Joi.string().valid('BASIC', 'PREMIUM', 'ENTERPRISE').required(),
  description: Joi.string().max(1000).optional(),
  features: Joi.object().optional(),
  price: Joi.number().min(0).required(),
  currency: Joi.string().default('INR'),
  durationDays: Joi.number().integer().min(1).optional(),
  listingLimit: Joi.number().integer().min(0).optional(),
  boostTier: Joi.string().optional(),
  isActive: Joi.boolean().default(true),
  sortOrder: Joi.number().integer().default(0),
  metadata: Joi.object().optional(),
});

// ID parameter schema
const idParamSchema = Joi.object({
  id: Joi.string().required(),
});

module.exports = {
  validateCreateSubscription: validate(createSubscriptionSchema),
  validateCancelSubscription: validate(cancelSubscriptionSchema),
  validateInitiatePayment: validate(initiatePaymentSchema),
  validateCreateRefund: validate(createRefundSchema),
  validateCoupon: validate(validateCouponSchema),
  validateCreateCoupon: validate(createCouponSchema),
  validateUpdateCoupon: validate(updateCouponSchema),
  validateCreatePackage: validate(createPackageSchema),
  validateIdParam: validate(idParamSchema, 'params'),
};
