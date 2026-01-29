'use strict';

const { AppError, ErrorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');
const { createProducer, TOPICS, EVENT_TYPES } = require('@real-estate/events');

const packageService = require('./package.service');

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
 * Create subscription
 */
async function createSubscription(userId, orgId, packageId, autoRenew = true) {
  const pkg = await packageService.getPackage(packageId);

  if (!pkg.isActive) {
    throw new AppError('Package is not active', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const startsAt = new Date();
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + (pkg.durationDays || 30));

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      orgId: orgId || null,
      packageId,
      status: 'ACTIVE',
      startsAt,
      endsAt,
      autoRenew,
    },
    include: {
      package: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.BILLING,
    EVENT_TYPES.BILLING.SUBSCRIPTION_CREATED,
    {
      subscriptionId: subscription.id,
      userId,
      orgId: orgId || null,
      packageId,
      startsAt: subscription.startsAt.toISOString(),
      endsAt: subscription.endsAt.toISOString(),
      createdAt: subscription.createdAt.toISOString(),
    },
    { key: subscription.id }
  );

  await producer.publish(
    TOPICS.BILLING,
    EVENT_TYPES.BILLING.SUBSCRIPTION_ACTIVATED,
    {
      subscriptionId: subscription.id,
      userId,
      orgId: orgId || null,
      packageId,
      activatedAt: subscription.startsAt.toISOString(),
    },
    { key: subscription.id }
  );

  return subscription;
}

/**
 * List subscriptions
 */
async function listSubscriptions(userId, orgId = null, filters = {}) {
  const where = {};
  if (userId) {
    where.userId = userId;
  }
  if (orgId) {
    where.orgId = orgId;
  }
  if (filters.status) {
    where.status = filters.status;
  }

  return prisma.subscription.findMany({
    where,
    include: {
      package: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get subscription by ID
 */
async function getSubscription(subscriptionId, userId = null) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      package: true,
      payments: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!subscription) {
    throw new AppError('Subscription not found', ErrorCodes.NOT_FOUND, 404);
  }

  // Check access
  if (userId && subscription.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  return subscription;
}

/**
 * Cancel subscription
 */
async function cancelSubscription(subscriptionId, userId, reason = '') {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new AppError('Subscription not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (subscription.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  const updatedSubscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason,
      autoRenew: false,
    },
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.BILLING,
    EVENT_TYPES.BILLING.SUBSCRIPTION_CANCELLED,
    {
      subscriptionId,
      userId,
      cancelledAt: updatedSubscription.cancelledAt.toISOString(),
      reason,
    },
    { key: subscriptionId }
  );

  return updatedSubscription;
}

/**
 * Check if subscription is active
 */
async function isSubscriptionActive(subscriptionId) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    return false;
  }

  return subscription.status === 'ACTIVE' && new Date(subscription.endsAt) > new Date();
}

module.exports = {
  createSubscription,
  listSubscriptions,
  getSubscription,
  cancelSubscription,
  isSubscriptionActive,
};
