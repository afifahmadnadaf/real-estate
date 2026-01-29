'use strict';

const crypto = require('crypto');
const express = require('express');

const app = express();
app.use(express.json({ limit: '2mb' }));

const port = parseInt(process.env.PORT, 10) || 3099;
const webhookTargetUrl = process.env.WEBHOOK_TARGET_URL || 'http://api-gateway:3000/v1/webhooks/razorpay';
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'local_razorpay_webhook_secret';

const state = {
  orderSeq: 0,
  paymentSeq: 0,
  refundSeq: 0,
  orders: new Map(),
  payments: new Map(),
  refunds: new Map(),
};

function nextId(prefix) {
  const now = Date.now().toString(36);
  const rand = crypto.randomBytes(6).toString('hex');
  return `${prefix}_${now}_${rand}`;
}

function signPayload(payload) {
  return crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
}

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/v1/orders', (req, res) => {
  const { amount, currency, receipt, notes } = req.body || {};
  const id = `order_${++state.orderSeq}`;
  const order = {
    id,
    amount: Math.round(Number(amount || 0) * 100),
    currency: (currency || 'INR').toUpperCase(),
    receipt: receipt || null,
    notes: notes || {},
    status: 'created',
  };
  state.orders.set(id, order);
  res.json(order);
});

app.get('/v1/payments/:id', (req, res) => {
  const payment = state.payments.get(req.params.id);
  if (!payment) return res.status(404).json({ error: 'not_found' });
  res.json(payment);
});

app.post('/v1/refunds', (req, res) => {
  const { paymentId, amount, notes } = req.body || {};
  const id = `rfnd_${++state.refundSeq}`;
  const refund = {
    id,
    payment_id: paymentId,
    amount: Math.round(Number(amount || 0) * 100),
    currency: 'INR',
    notes: notes || {},
    status: 'processed',
  };
  state.refunds.set(id, refund);
  res.json(refund);
});

async function sendRazorpayWebhook(bodyObj) {
  const payload = JSON.stringify(bodyObj);
  const signature = signPayload(payload);

  const resp = await fetch(webhookTargetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': signature,
    },
    body: payload,
  });

  const text = await resp.text();
  return { status: resp.status, body: text };
}

app.post('/v1/simulate/payment-captured', async (req, res) => {
  const { orderId, paymentId } = req.body || {};
  if (!orderId) return res.status(400).json({ error: 'orderId_required' });

  const pid = paymentId || `pay_${++state.paymentSeq}`;
  const payment = {
    id: pid,
    order_id: orderId,
    status: 'captured',
    error: null,
  };
  state.payments.set(pid, payment);

  const evt = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: payment,
      },
    },
  };

  const sent = await sendRazorpayWebhook(evt);
  res.json({ ok: true, sent });
});

app.post('/v1/simulate/payment-failed', async (req, res) => {
  const { orderId, paymentId, reason } = req.body || {};
  if (!orderId) return res.status(400).json({ error: 'orderId_required' });

  const pid = paymentId || `pay_${++state.paymentSeq}`;
  const payment = {
    id: pid,
    order_id: orderId,
    status: 'failed',
    error: { description: reason || 'Payment failed' },
  };
  state.payments.set(pid, payment);

  const evt = {
    event: 'payment.failed',
    payload: {
      payment: {
        entity: payment,
      },
    },
  };

  const sent = await sendRazorpayWebhook(evt);
  res.json({ ok: true, sent });
});

app.listen(port, () => {
  process.stdout.write(`fake-payments listening on ${port}\n`);
});

