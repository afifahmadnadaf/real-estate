'use strict';

const { AppError, ErrorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

async function listRefunds(userId) {
  return prisma.refund.findMany({
    where: {
      payment: {
        userId,
      },
    },
    include: {
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getRefund(refundId, userId) {
  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    include: { payment: true },
  });
  if (!refund) {
    throw new AppError('Refund not found', ErrorCodes.NOT_FOUND, 404);
  }
  if (refund.payment?.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }
  return refund;
}

module.exports = {
  listRefunds,
  getRefund,
};
