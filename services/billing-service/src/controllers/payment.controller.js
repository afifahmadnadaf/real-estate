'use strict';

const { httpStatus } = require('@real-estate/common');

const invoiceService = require('../services/invoice.service');
const paymentService = require('../services/payment.service');

/**
 * Initiate payment
 */
async function initiatePayment(req, res, next) {
  try {
    const userId = req.user.id;
    const orgId = req.user.orgId || null;
    const result = await paymentService.initiatePayment(userId, orgId, req.body);
    res.status(httpStatus.CREATED).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List payments
 */
async function listPayments(req, res, next) {
  try {
    const userId = req.user.id;
    const orgId = req.user.orgId || null;
    const filters = {
      status: req.query.status,
      subscriptionId: req.query.subscriptionId,
    };
    const payments = await paymentService.listPayments(userId, orgId, filters);
    res.status(httpStatus.OK).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get payment
 */
async function getPayment(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const payment = await paymentService.getPayment(id, userId);
    res.status(httpStatus.OK).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create refund
 */
async function createRefund(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { amount, reason } = req.body;
    const refund = await paymentService.createRefund(id, amount, reason, userId);
    res.status(httpStatus.CREATED).json({
      success: true,
      data: refund,
      message: 'Refund initiated successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retry payment
 */
async function retryPayment(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await paymentService.retryPayment(id, userId);
    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List invoices
 */
async function listInvoices(req, res, next) {
  try {
    const userId = req.user.id;
    const orgId = req.user.orgId || null;
    const invoices = await invoiceService.listInvoices(userId, orgId);
    res.status(httpStatus.OK).json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get invoice
 */
async function getInvoice(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const invoice = await invoiceService.getInvoice(id, userId);
    res.status(httpStatus.OK).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  initiatePayment,
  listPayments,
  getPayment,
  createRefund,
  retryPayment,
  listInvoices,
  getInvoice,
};
