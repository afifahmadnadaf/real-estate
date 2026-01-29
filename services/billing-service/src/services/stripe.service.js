'use strict';

const crypto = require('crypto');

const config = require('../config');

function parseStripeSignature(header) {
  if (!header) {
    return {};
  }
  const parts = String(header)
    .split(',')
    .map((p) => p.trim());
  const out = {};
  for (const part of parts) {
    const [k, v] = part.split('=');
    out[k] = v;
  }
  return out;
}

function verifyWebhookSignature(payload, signatureHeader) {
  const sig = parseStripeSignature(signatureHeader);
  const timestamp = sig.t;
  const v1 = sig.v1;
  if (!timestamp || !v1 || !config.stripe.webhookSecret) {
    return { ok: false, error: 'missing_signature_or_secret' };
  }
  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac('sha256', config.stripe.webhookSecret)
    .update(signedPayload)
    .digest('hex');
  const a = Buffer.from(v1);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return { ok: false };
  }
  const ok = crypto.timingSafeEqual(a, b);
  return { ok };
}

module.exports = {
  verifyWebhookSignature,
};
