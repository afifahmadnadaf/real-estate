'use strict';

const { httpStatus } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');
const { createProducer, TOPICS, EVENT_TYPES } = require('@real-estate/events');

const paymentService = require('../services/payment.service');
const razorpayService = require('../services/razorpay.service');
const stripeService = require('../services/stripe.service');

let eventProducer = null;
async function getProducer() {
  if (!eventProducer) {
    eventProducer = createProducer({ service: 'billing-service' });
    await eventProducer.connect();
  }
  return eventProducer;
}
/**
 * Razorpay webhook handler
 */
// async function razorpayWebhook(req, res, next) {
async function razorpayWebhook(req, res, next) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        error: 'Invalid webhook signature',
      });
    }

    const event = req.body.event;
    const paymentData = req.body.payload.payment?.entity;

    // Store webhook event
    try {
      const eventId = `${event}:${paymentData?.id || paymentData?.order_id || Date.now()}`;
      await prisma.webhookEvent.upsert({
        where: { eventId },
        update: { status: 'RECEIVED', processedAt: null, rawBody: payload, signature },
        create: {
          provider: 'RAZORPAY',
          eventId,
          signature,
          rawBody: payload,
          status: 'RECEIVED',
        },
      });
    } catch (error) {
      void error;
    }

    if (event === 'payment.captured' || event === 'payment.authorized') {
      // Find payment by gateway order ID or payment ID
      const payment = await paymentService.getPaymentByGatewayId(
        paymentData.order_id,
        paymentData.id
      );

      if (payment) {
        await paymentService.completePayment(payment.id, paymentData.id, signature);
      }
    } else if (event === 'payment.failed') {
      const payment = await paymentService.getPaymentByGatewayId(
        paymentData.order_id,
        paymentData.id
      );

      if (payment) {
        await paymentService.failPayment(
          payment.id,
          paymentData.error?.description || 'Payment failed'
        );
      }
    }

    res.status(httpStatus.OK).json({ success: true });
  } catch (error) {
    next(error);
  }
}

/**
 * Stripe webhook handler
 */
async function stripeWebhook(req, res, next) {
  try {
    const signatureHeader = req.headers['stripe-signature'];
    const payload = req.body instanceof Buffer ? req.body.toString('utf8') : String(req.body || '');
    const verified = stripeService.verifyWebhookSignature(payload, signatureHeader);

    if (!verified.ok) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        error: verified.error || 'Invalid webhook signature',
      });
    }

    const event = JSON.parse(payload);
    const type = event.type;
    const obj = event.data?.object || {};

    // Store webhook event
    try {
      await prisma.webhookEvent.upsert({
        where: { eventId: event.id },
        update: {
          status: 'RECEIVED',
          processedAt: null,
          rawBody: payload,
          signature: signatureHeader,
        },
        create: {
          provider: 'STRIPE',
          eventId: event.id,
          signature: signatureHeader,
          rawBody: payload,
          status: 'RECEIVED',
        },
      });
    } catch (error) {
      void error;
    }

    const producer = await getProducer();

    if (type === 'payment_intent.succeeded') {
      await producer.publish(
        TOPICS.BILLING,
        EVENT_TYPES.BILLING.PAYMENT_COMPLETED,
        {
          paymentId: obj.metadata?.paymentId || obj.id,
          userId: obj.metadata?.userId,
          orgId: obj.metadata?.orgId,
          amount: (obj.amount_received || obj.amount) / 100,
          currency: obj.currency?.toUpperCase() || 'INR',
          gateway: 'STRIPE',
          gatewayPaymentId: obj.id,
          completedAt: new Date().toISOString(),
        },
        { key: String(obj.metadata?.paymentId || obj.id) }
      );
    } else if (type === 'charge.refunded') {
      await producer.publish(
        TOPICS.BILLING,
        EVENT_TYPES.BILLING.REFUND_COMPLETED,
        {
          refundId: obj.refunds?.data?.[0]?.id || obj.id,
          paymentId: obj.payment_intent || obj.id,
          amount: (obj.amount_refunded || 0) / 100,
          gatewayRefundId: obj.refunds?.data?.[0]?.id || obj.id,
          completedAt: new Date().toISOString(),
        },
        { key: String(obj.refunds?.data?.[0]?.id || obj.id) }
      );
    } else if (type === 'invoice.payment_failed') {
      await producer.publish(
        TOPICS.BILLING,
        EVENT_TYPES.BILLING.PAYMENT_FAILED,
        {
          paymentId: obj.payment_intent || obj.id,
          userId: obj.customer,
          reason: obj.last_payment_error?.message || 'payment_failed',
          failedAt: new Date().toISOString(),
        },
        { key: String(obj.payment_intent || obj.id) }
      );
    }

    res.status(httpStatus.OK).json({ success: true });
  } catch (error) {
    next(error);
  }
}

async function shiprocketWebhook(req, res, next) {
  try {
    res.status(httpStatus.OK).json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  razorpayWebhook,
  stripeWebhook,
  shiprocketWebhook,
};
