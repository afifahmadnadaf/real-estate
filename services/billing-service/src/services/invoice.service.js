'use strict';

const { prisma } = require('@real-estate/db-models');
const { createProducer, TOPICS, EVENT_TYPES } = require('@real-estate/events');

const config = require('../config');

// Create a singleton producer instance
let eventProducer = null;

async function getProducer() {
  if (!eventProducer) {
    eventProducer = createProducer({ service: 'billing-service' });
    await eventProducer.connect();
  }
  return eventProducer;
}

/**
 * Generate invoice number
 */
async function generateInvoiceNumber() {
  const count = await prisma.invoice.count();
  const number = String(count + 1).padStart(6, '0');
  return `${config.invoice.prefix}-${new Date().getFullYear()}-${number}`;
}

/**
 * Generate invoice
 */
async function generateInvoice(paymentId) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  // Check if invoice already exists
  const existingInvoice = await prisma.invoice.findUnique({
    where: { paymentId },
  });

  if (existingInvoice) {
    return existingInvoice;
  }

  // Calculate tax
  const amount = parseFloat(payment.amount);
  const taxRate = config.invoice.taxRate / 100;
  const taxAmount = (amount * taxRate) / (1 + taxRate);
  const baseAmount = amount - taxAmount;
  const totalAmount = amount;

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Create invoice
  const invoice = await prisma.invoice.create({
    data: {
      paymentId,
      userId: payment.userId,
      orgId: payment.orgId || null,
      invoiceNumber,
      amount: baseAmount,
      taxAmount,
      totalAmount,
      currency: payment.currency,
      billingAddress: null, // TODO: Get from user profile
      pdfUrl: null, // TODO: Generate PDF
    },
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.BILLING,
    EVENT_TYPES.BILLING.INVOICE_GENERATED,
    {
      invoiceId: invoice.id,
      invoiceNumber,
      paymentId,
      userId: payment.userId,
      amount: totalAmount,
      generatedAt: invoice.createdAt.toISOString(),
    },
    { key: invoice.id }
  );

  return invoice;
}

/**
 * List invoices
 */
async function listInvoices(userId, orgId = null) {
  const where = {};
  if (userId) {
    where.userId = userId;
  }
  if (orgId) {
    where.orgId = orgId;
  }

  return prisma.invoice.findMany({
    where,
    include: {
      payment: {
        include: {
          subscription: {
            include: {
              package: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get invoice by ID
 */
async function getInvoice(invoiceId, userId = null) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      payment: {
        include: {
          subscription: {
            include: {
              package: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Check access
  if (userId && invoice.userId !== userId) {
    throw new Error('Forbidden');
  }

  return invoice;
}

module.exports = {
  generateInvoice,
  listInvoices,
  getInvoice,
};
