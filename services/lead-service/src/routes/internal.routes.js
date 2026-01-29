'use strict';

const { internalAuth, httpStatus } = require('@real-estate/common');
const { createLogger } = require('@real-estate/common');
const express = require('express');
const axios = require('axios');
const config = require('../config');

const router = express.Router();
router.use(internalAuth());

const logger = createLogger({ service: 'lead-service' });

router.post('/leads/deliver', async (req, res, next) => {
  try {
    const { leadId, partnerId, attempt = 1, metadata = {} } = req.body || {};
    if (!leadId || !partnerId) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ success: false, error: 'leadId and partnerId required' });
    }

    // Determine target URL: use specific partner URL if in metadata, otherwise global config, else mock
    const targetUrl = metadata.crmWebhookUrl || config.crm.webhookUrl;
    
    let delivered = false;
    let responseData = null;

    if (targetUrl) {
      try {
        logger.info({ leadId, partnerId, targetUrl }, 'Delivering lead to CRM webhook');
        
        const response = await axios.post(targetUrl, {
          event: 'LEAD_GENERATED',
          leadId,
          partnerId,
          timestamp: new Date().toISOString(),
          data: metadata
        }, {
          timeout: 5000,
          headers: {
            'X-Webhook-Secret': config.crm.webhookSecret || '',
            'User-Agent': 'RealEstatePlatform/1.0'
          }
        });

        if (response.status >= 200 && response.status < 300) {
          delivered = true;
          responseData = response.data;
        }
      } catch (err) {
        logger.warn({ leadId, partnerId, error: err.message }, 'CRM webhook delivery failed');
      }
    } else {
      // Fallback for dev/mock: simulate success if no URL configured
      logger.info({ leadId, partnerId }, 'No CRM webhook configured, simulating successful delivery');
      delivered = true; 
    }

    res.json({ delivered, attempt, response: responseData });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
