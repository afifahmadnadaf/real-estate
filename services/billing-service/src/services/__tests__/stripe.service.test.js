'use strict';

const crypto = require('crypto');

describe('stripeService.verifyWebhookSignature', () => {
  const secret = 'test_secret';
  const payload = JSON.stringify({ id: 'evt_123', type: 'payment_intent.succeeded' });
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const sig = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  const header = `t=${timestamp},v1=${sig}`;
  let stripeService;

  beforeAll(() => {
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    jest.resetModules();
    stripeService = require('../stripe.service');
  });

  it('verifies a valid signature', () => {
    const result = stripeService.verifyWebhookSignature(payload, header);
    expect(result.ok).toBe(true);
  });

  it('rejects invalid signature', () => {
    const badHeader = `t=${timestamp},v1=bad`;
    const result = stripeService.verifyWebhookSignature(payload, badHeader);
    expect(result.ok).toBe(false);
  });
});
