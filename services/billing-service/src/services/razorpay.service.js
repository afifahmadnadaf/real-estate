'use strict';

const crypto = require('crypto');

const Razorpay = require('razorpay');

const config = require('../config');

let razorpayInstance = null;

/**
 * Get Razorpay instance
 */
function getRazorpayInstance() {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }
  return razorpayInstance;
}

/**
 * Create order
 */
async function createOrder(amount, currency, receipt, notes = {}) {
  const razorpay = getRazorpayInstance();
  const options = {
    amount: Math.round(amount * 100), // Convert to paise
    currency: currency || 'INR',
    receipt: receipt,
    notes,
  };

  const order = await razorpay.orders.create(options);
  return order;
}

/**
 * Verify payment signature
 */
function verifyPaymentSignature(orderId, paymentId, signature) {
  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(payload)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.webhookSecret)
    .update(payload)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Capture payment
 */
async function capturePayment(paymentId, amount) {
  const razorpay = getRazorpayInstance();
  return razorpay.payments.capture(paymentId, Math.round(amount * 100));
}

/**
 * Get payment details
 */
async function getPayment(paymentId) {
  const razorpay = getRazorpayInstance();
  return razorpay.payments.fetch(paymentId);
}

/**
 * Create refund
 */
async function createRefund(paymentId, amount, notes = {}) {
  const razorpay = getRazorpayInstance();
  const refundData = {
    amount: Math.round(amount * 100),
    notes,
  };

  const refund = await razorpay.payments.refund(paymentId, refundData);
  return refund;
}

/**
 * Get refund details
 */
async function getRefund(refundId) {
  const razorpay = getRazorpayInstance();
  return razorpay.refunds.fetch(refundId);
}

module.exports = {
  getRazorpayInstance,
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  capturePayment,
  getPayment,
  createRefund,
  getRefund,
};
