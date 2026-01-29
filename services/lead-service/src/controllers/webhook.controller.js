'use strict';

const crypto = require('crypto');

const { httpStatus } = require('@real-estate/common');

const leadService = require('../services/lead.service');

function verifyPartnerSignature(rawBody, signatureHeader, secret) {
  if (!secret) {
    return false;
  }
  if (!signatureHeader) {
    return false;
  }
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function partnerLeadWebhook(req, res, next) {
  try {
    const secret = process.env.PARTNER_WEBHOOK_DEFAULT_SECRET;
    const signature = req.headers['x-partner-signature'];
    const rawBody =
      req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body || {});

    if (!verifyPartnerSignature(rawBody, signature, secret)) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ success: false, error: 'Invalid signature' });
    }

    const body = JSON.parse(rawBody);
    const { partnerId, externalLeadId, payload } = body || {};

    if (!partnerId || !externalLeadId || !payload) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, error: 'Invalid payload' });
    }

    const buyerName = payload.buyerName || 'Unknown';
    const buyerPhone = payload.buyerPhone;
    if (!buyerPhone) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ success: false, error: 'Buyer phone required' });
    }

    const lead = await leadService.createLead({
      sellerId: payload.sellerId || payload.agentId,
      orgId: payload.orgId || null,
      source: 'PARTNER',
      message: payload.message || '',
      buyerName,
      buyerPhone,
      buyerEmail: payload.buyerEmail || null,
      metadata: {
        partnerId,
        externalLeadId,
        raw: payload,
      },
    });

    res.status(httpStatus.OK).json({ accepted: true, id: lead.id });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  partnerLeadWebhook,
};
