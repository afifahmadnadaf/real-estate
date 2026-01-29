'use strict';

const { AppError, ErrorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

/**
 * List user's price alerts
 */
async function listPriceAlerts(userId, options = {}) {
  const { limit = 20, offset = 0, isActive } = options;

  const where = { userId };
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [alerts, total] = await Promise.all([
    prisma.priceAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.priceAlert.count({ where }),
  ]);

  return {
    alerts,
    total,
    limit,
    offset,
  };
}

/**
 * Create price alert
 */
async function createPriceAlert(userId, data) {
  // Check if alert already exists
  const existing = await prisma.priceAlert.findUnique({
    where: {
      userId_propertyId: {
        userId,
        propertyId: data.propertyId,
      },
    },
  });

  if (existing) {
    throw new AppError('Price alert already exists', ErrorCodes.ALREADY_EXISTS, 409);
  }

  const alert = await prisma.priceAlert.create({
    data: {
      userId,
      propertyId: data.propertyId,
      targetPrice: data.targetPrice,
      isActive: true,
    },
  });

  return alert;
}

/**
 * Update price alert
 */
async function updatePriceAlert(userId, alertId, data) {
  const alert = await prisma.priceAlert.findUnique({
    where: { id: alertId },
  });

  if (!alert) {
    throw new AppError('Price alert not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (alert.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  const updated = await prisma.priceAlert.update({
    where: { id: alertId },
    data: {
      targetPrice: data.targetPrice,
      isActive: data.isActive,
    },
  });

  return updated;
}

/**
 * Delete price alert
 */
async function deletePriceAlert(userId, alertId) {
  const alert = await prisma.priceAlert.findUnique({
    where: { id: alertId },
  });

  if (!alert) {
    throw new AppError('Price alert not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (alert.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  await prisma.priceAlert.delete({
    where: { id: alertId },
  });

  return { success: true };
}

module.exports = {
  listPriceAlerts,
  createPriceAlert,
  updatePriceAlert,
  deletePriceAlert,
};
