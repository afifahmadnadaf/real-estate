'use strict';

const { internalAuth, httpStatus } = require('@real-estate/common');
const express = require('express');

const notificationService = require('../services/notification.service');

const router = express.Router();
router.use(internalAuth());

router.post('/notifications/send', async (req, res, next) => {
  try {
    const { to, channel, template, data } = req.body || {};
    if (!to || !template) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ success: false, error: 'to and template required' });
    }
    const notif = await notificationService.sendNotification({
      userId: to,
      templateCode: template,
      channels: channel ? [channel] : undefined,
      variables: data || {},
    });
    res.json({ enqueued: true, id: notif.id });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
