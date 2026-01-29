'use strict';

const { AppError, ErrorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');
const { createProducer, TOPICS, EVENT_TYPES } = require('@real-estate/events');
const { v4: uuidv4 } = require('uuid');

const config = require('../config');

const couponService = require('./coupon.service');
const invoiceService = require('./invoice.service');
const paymentGateway = require('./payment-gateway');

// Create a singleton producer instance
let eventProducer = null;

async function getProducer() {
  if (!eventProducer) {
    eventProducer = createProducer({ service: 'billing-service' });
    await eventProducer.connect();
  }
  return eventProducer;
}

/**
 * Initiate payment
 */
async function initiatePayment(userId, orgId, data) {
  const { amount, currency, subscriptionId, couponCode, idempotencyKey } = data;

  // Check idempotency
  if (idempotencyKey) {
    const existingPayment = await prisma.payment.findUnique({
      where: { idempotencyKey },
    });
    if (existingPayment) {
      return existingPayment;
    }
  }

  // Calculate discount if coupon provided
  let finalAmount = parseFloat(amount);
  let discountAmount = 0;
  let couponId = null;

  if (couponCode) {
    const couponResult = await couponService.validateCoupon(couponCode, amount);
    if (couponResult.valid) {
      discountAmount = couponResult.discountAmount;
      finalAmount = couponResult.finalAmount;
      couponId = couponResult.couponId;
    }
  }

  // Create payment record
  const provider = paymentGateway.getProvider();
  const gatewayName = provider === 'local' ? 'LOCAL' : 'RAZORPAY';
  const payment = await prisma.payment.create({
    data: {
      userId,
      orgId: orgId || null,
      subscriptionId: subscriptionId || null,
      amount: finalAmount,
      currency: currency || 'INR',
      status: 'PENDING',
      gateway: gatewayName,
      idempotencyKey: idempotencyKey || uuidv4(),
    },
  });

  // Create Razorpay order
  const receipt = `PAY_${payment.id.substring(0, 8).toUpperCase()}`;
  const order = await paymentGateway.createOrder(finalAmount, currency || 'INR', receipt, {
    paymentId: payment.id,
    userId,
    subscriptionId: subscriptionId || null,
  });

  // Update payment with order ID
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      gatewayOrderId: order.id,
    },
  });

  // Apply coupon if used
  if (couponId && discountAmount > 0) {
    await couponService.applyCoupon(couponId, userId, payment.id, discountAmount);
  }

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.BILLING,
    EVENT_TYPES.BILLING.PAYMENT_INITIATED,
    {
      paymentId: payment.id,
      userId,
      orgId: orgId || null,
      subscriptionId: subscriptionId || null,
      amount: finalAmount,
      currency: currency || 'INR',
      gatewayOrderId: order.id,
      initiatedAt: payment.createdAt.toISOString(),
    },
    { key: payment.id }
  );

  return {
    payment: updatedPayment,
    order: {
      id: order.id,
      amount: order.amount / 100, // Convert from paise
      currency: order.currency,
      key: paymentGateway.getPublicKey(),
    },
  };
}

async function retryPayment(paymentId, userId) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });
  if (!payment) {
    throw new AppError('Payment not found', ErrorCodes.NOT_FOUND, 404);
  }
  if (payment.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }
  if (payment.status !== 'FAILED') {
    throw new AppError('Only failed payments can be retried', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const receipt = `PAY_${payment.id.substring(0, 8).toUpperCase()}`;
  const order = await paymentGateway.createOrder(
    parseFloat(payment.amount),
    payment.currency,
    receipt,
    {
      paymentId: payment.id,
      userId,
      subscriptionId: payment.subscriptionId || null,
      retry: true,
    }
  );

  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: 'PENDING',
      gatewayOrderId: order.id,
      gatewayPaymentId: null,
      gatewaySignature: null,
      failureReason: null,
      completedAt: null,
    },
  });

  const producer = await getProducer();
  await producer.publish(
    TOPICS.BILLING,
    EVENT_TYPES.BILLING.PAYMENT_INITIATED,
    {
      paymentId: payment.id,
      userId,
      orgId: payment.orgId || null,
      subscriptionId: payment.subscriptionId || null,
      amount: parseFloat(payment.amount),
      currency: payment.currency,
      gatewayOrderId: order.id,
      initiatedAt: updatedPayment.updatedAt.toISOString(),
    },
    { key: payment.id }
  );

  return {
    payment: updatedPayment,
    order: {
      id: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      key: paymentGateway.getPublicKey(),
    },
  };
}

/**
 * Complete payment (webhook handler)
 */
async function completePayment(paymentId, gatewayPaymentId, signature) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new AppError('Payment not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (payment.status === 'COMPLETED') {
    return payment; // Already completed
  }

  // Update payment status
  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: 'COMPLETED',
      gatewayPaymentId,
      gatewaySignature: signature,
      completedAt: new Date(),
    },
  });

  // Generate invoice
  await invoiceService.generateInvoice(updatedPayment.id);

  // Activate subscription if applicable
  if (payment.subscriptionId) {
    // Subscription is already created, just emit event
    const producer = await getProducer();
    await producer.publish(
      TOPICS.BILLING,
      EVENT_TYPES.BILLING.SUBSCRIPTION_ACTIVATED,
      {
        subscriptionId: payment.subscriptionId,
        userId: payment.userId,
        orgId: payment.orgId,
        activatedAt: new Date().toISOString(),
      },
      { key: payment.subscriptionId }
    );
  }

  // Emit payment completed event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.BILLING,
    EVENT_TYPES.BILLING.PAYMENT_COMPLETED,
    {
      paymentId,
      userId: payment.userId,
      orgId: payment.orgId,
      subscriptionId: payment.subscriptionId,
      amount: parseFloat(payment.amount),
      currency: payment.currency,
      completedAt: updatedPayment.completedAt.toISOString(),
    },
    { key: paymentId }
  );

  return updatedPayment;
}

/**
 * Fail payment
 */
async function failPayment(paymentId, reason) {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: 'FAILED',
      failureReason: reason,
    },
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.BILLING,
    EVENT_TYPES.BILLING.PAYMENT_FAILED,
    {
      paymentId,
      userId: payment.userId,
      reason,
      failedAt: new Date().toISOString(),
    },
    { key: paymentId }
  );

  return payment;
}

/**
 * List payments
 */
async function listPayments(userId, orgId = null, filters = {}) {
  const where = {};
  if (userId) {
    where.userId = userId;
  }
  if (orgId) {
    where.orgId = orgId;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.subscriptionId) {
    where.subscriptionId = filters.subscriptionId;
  }

  return prisma.payment.findMany({
    where,
    include: {
      subscription: {
        include: {
          package: true,
        },
      },
      invoice: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get payment by ID
 */
async function getPayment(paymentId, userId = null) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      subscription: {
        include: {
          package: true,
        },
      },
      invoice: true,
      refunds: true,
    },
  });

  if (!payment) {
    throw new AppError('Payment not found', ErrorCodes.NOT_FOUND, 404);
  }

  // Check access
  if (userId && payment.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  return payment;
}

/**
 * Get payment by gateway ID
 */
async function getPaymentByGatewayId(orderId, paymentId) {
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ gatewayOrderId: orderId }, { gatewayPaymentId: paymentId }],
    },
  });

  return payment;
}

/**
 * Create refund
 */
async function createRefund(paymentId, amount, reason, userId) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new AppError('Payment not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (payment.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (payment.status !== 'COMPLETED') {
    throw new AppError('Payment must be completed to refund', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const refundAmount = parseFloat(amount);
  if (refundAmount > parseFloat(payment.amount)) {
    throw new AppError(
      'Refund amount cannot exceed payment amount',
      ErrorCodes.VALIDATION_ERROR,
      400
    );
  }

  // Create refund in Razorpay
  const razorpayRefund = await paymentGateway.createRefund(
    payment.gatewayPaymentId,
    refundAmount,
    { reason, refundedBy: userId }
  );

  // Create refund record
  const refund = await prisma.refund.create({
    data: {
      paymentId,
      amount: refundAmount,
      reason,
      status: 'COMPLETED',
      gatewayRefundId: razorpayRefund.id,
      processedAt: new Date(),
    },
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.BILLING,
    EVENT_TYPES.BILLING.REFUND_CREATED,
    {
      refundId: refund.id,
      paymentId,
      amount: refundAmount,
      reason,
      createdAt: refund.createdAt.toISOString(),
    },
    { key: refund.id }
  );

  await producer.publish(
    TOPICS.BILLING,
    EVENT_TYPES.BILLING.REFUND_COMPLETED,
    {
      refundId: refund.id,
      paymentId,
      amount: refundAmount,
      completedAt: refund.processedAt.toISOString(),
    },
    { key: refund.id }
  );

  return refund;
}

module.exports = {
  initiatePayment,
  retryPayment,
  completePayment,
  failPayment,
  listPayments,
  getPayment,
  getPaymentByGatewayId,
  createRefund,
};
