'use strict';

const { httpStatus } = require('@real-estate/common');

const invoiceService = require('../services/invoice.service');

async function listInvoices(req, res, next) {
  try {
    const userId = req.user.id;
    const orgId = req.user.orgId || null;
    const invoices = await invoiceService.listInvoices(userId, orgId);
    res.status(httpStatus.OK).json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
}

async function getInvoice(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const invoice = await invoiceService.getInvoice(id, userId);
    res.status(httpStatus.OK).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listInvoices,
  getInvoice,
};
