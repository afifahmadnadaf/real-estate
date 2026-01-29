'use strict';

const { httpStatus } = require('@real-estate/common');

const subscriptionService = require('../services/subscription.service');

/**
 * Create subscription
 */
async function createSubscription(req, res, next) {
  try {
    const userId = req.user.id;
    const { orgId, packageId, autoRenew } = req.body;
    const subscription = await subscriptionService.createSubscription(
      userId,
      orgId,
      packageId,
      autoRenew !== false
    );
    res.status(httpStatus.CREATED).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List subscriptions
 */
async function listSubscriptions(req, res, next) {
  try {
    const userId = req.user.id;
    const orgId = req.user.orgId || null;
    const filters = {
      status: req.query.status,
    };
    const subscriptions = await subscriptionService.listSubscriptions(userId, orgId, filters);
    res.status(httpStatus.OK).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get subscription
 */
async function getSubscription(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const subscription = await subscriptionService.getSubscription(id, userId);
    res.status(httpStatus.OK).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel subscription
 */
async function cancelSubscription(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;
    const subscription = await subscriptionService.cancelSubscription(id, userId, reason);
    res.status(httpStatus.OK).json({
      success: true,
      data: subscription,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createSubscription,
  listSubscriptions,
  getSubscription,
  cancelSubscription,
};
