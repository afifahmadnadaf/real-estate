'use strict';

const { z } = require('zod');

/**
 * Billing event payload schemas
 */

// Payment initiated
const paymentInitiatedSchema = z.object({
  paymentId: z.string(),
  userId: z.string(),
  orgId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  gateway: z.string(),
  gatewayOrderId: z.string(),
  packageId: z.string().optional(),
  subscriptionId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  initiatedAt: z.string().datetime(),
});

// Payment completed
const paymentCompletedSchema = z.object({
  paymentId: z.string(),
  userId: z.string(),
  orgId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  gateway: z.string(),
  gatewayOrderId: z.string(),
  gatewayPaymentId: z.string(),
  gatewaySignature: z.string().optional(),
  packageId: z.string().optional(),
  subscriptionId: z.string().optional(),
  completedAt: z.string().datetime(),
});

// Payment failed
const paymentFailedSchema = z.object({
  paymentId: z.string(),
  userId: z.string(),
  orgId: z.string().optional(),
  amount: z.number().positive(),
  gateway: z.string(),
  gatewayOrderId: z.string(),
  failureReason: z.string(),
  failureCode: z.string().optional(),
  failedAt: z.string().datetime(),
});

// Subscription created
const subscriptionCreatedSchema = z.object({
  subscriptionId: z.string(),
  userId: z.string(),
  orgId: z.string().optional(),
  packageId: z.string(),
  packageName: z.string(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  autoRenew: z.boolean().default(true),
  createdAt: z.string().datetime(),
});

// Subscription activated
const subscriptionActivatedSchema = z.object({
  subscriptionId: z.string(),
  userId: z.string(),
  orgId: z.string().optional(),
  packageId: z.string(),
  paymentId: z.string(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  activatedAt: z.string().datetime(),
});

// Subscription cancelled
const subscriptionCancelledSchema = z.object({
  subscriptionId: z.string(),
  userId: z.string(),
  orgId: z.string().optional(),
  reason: z.string().optional(),
  cancelledBy: z.string(),
  cancelledAt: z.string().datetime(),
  effectiveAt: z.string().datetime(), // When it actually ends
});

// Subscription expired
const subscriptionExpiredSchema = z.object({
  subscriptionId: z.string(),
  userId: z.string(),
  orgId: z.string().optional(),
  packageId: z.string(),
  expiredAt: z.string().datetime(),
});

// Refund created
const refundCreatedSchema = z.object({
  refundId: z.string(),
  paymentId: z.string(),
  userId: z.string(),
  amount: z.number().positive(),
  reason: z.string(),
  requestedBy: z.string(),
  createdAt: z.string().datetime(),
});

// Refund completed
const refundCompletedSchema = z.object({
  refundId: z.string(),
  paymentId: z.string(),
  userId: z.string(),
  amount: z.number().positive(),
  gatewayRefundId: z.string(),
  completedAt: z.string().datetime(),
});

// Invoice generated
const invoiceGeneratedSchema = z.object({
  invoiceId: z.string(),
  invoiceNumber: z.string(),
  paymentId: z.string(),
  userId: z.string(),
  orgId: z.string().optional(),
  amount: z.number(),
  taxAmount: z.number().optional(),
  totalAmount: z.number(),
  currency: z.string().default('INR'),
  pdfUrl: z.string().url().optional(),
  generatedAt: z.string().datetime(),
});

module.exports = {
  paymentInitiatedSchema,
  paymentCompletedSchema,
  paymentFailedSchema,
  subscriptionCreatedSchema,
  subscriptionActivatedSchema,
  subscriptionCancelledSchema,
  subscriptionExpiredSchema,
  refundCreatedSchema,
  refundCompletedSchema,
  invoiceGeneratedSchema,
};
