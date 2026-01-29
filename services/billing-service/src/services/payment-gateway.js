'use strict';

const razorpayService = require('./razorpay.service');
const config = require('../config');

function getProvider() {
  return String(config.payments && config.payments.provider ? config.payments.provider : 'razorpay').toLowerCase();
}

function getPublicKey() {
  if (getProvider() === 'local') return 'local_test_key';
  return config.razorpay.keyId;
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error(`payment_provider_http_${res.status}`);
  return res.json();
}

async function getJson(url) {
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw new Error(`payment_provider_http_${res.status}`);
  return res.json();
}

async function createOrder(amount, currency, receipt, notes = {}) {
  if (getProvider() === 'local') {
    const base = config.payments.localProviderUrl;
    return postJson(`${base}/v1/orders`, { amount, currency, receipt, notes });
  }
  return razorpayService.createOrder(amount, currency, receipt, notes);
}

async function getPayment(paymentId) {
  if (getProvider() === 'local') {
    const base = config.payments.localProviderUrl;
    return getJson(`${base}/v1/payments/${encodeURIComponent(paymentId)}`);
  }
  return razorpayService.getPayment(paymentId);
}

async function createRefund(paymentId, amount, notes = {}) {
  if (getProvider() === 'local') {
    const base = config.payments.localProviderUrl;
    return postJson(`${base}/v1/refunds`, { paymentId, amount, notes });
  }
  return razorpayService.createRefund(paymentId, amount, notes);
}

module.exports = {
  getProvider,
  getPublicKey,
  createOrder,
  getPayment,
  createRefund,
};

