'use strict';

const { httpStatus } = require('@real-estate/common');

const refundService = require('../services/refund.service');

async function listRefunds(req, res, next) {
  try {
    const userId = req.user.id;
    const refunds = await refundService.listRefunds(userId);
    res.status(httpStatus.OK).json({ success: true, data: refunds });
  } catch (error) {
    next(error);
  }
}

async function getRefund(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const refund = await refundService.getRefund(id, userId);
    res.status(httpStatus.OK).json({ success: true, data: refund });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listRefunds,
  getRefund,
};
