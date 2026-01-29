'use strict';

const { AppError, errorCodes, httpStatus } = require('@real-estate/common');

const reviewService = require('../services/review.service');

function requireUser(req) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
  }
  return userId;
}

function requireAdmin(req) {
  const role = req.headers['x-user-role'];
  if (role !== 'ADMIN') {
    throw new AppError('Forbidden', 403, errorCodes.AUTHORIZATION.FORBIDDEN);
  }
}

async function createReview(req, res, next) {
  try {
    const userId = requireUser(req);
    const review = await reviewService.createReview(userId, req.body);
    res.status(httpStatus.CREATED).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}

async function listReviews(req, res, next) {
  try {
    const reviews = await reviewService.listReviews({
      entityType: req.query.entityType,
      entityId: req.query.entityId,
      limit: parseInt(req.query.limit, 10) || 50,
      offset: parseInt(req.query.offset, 10) || 0,
    });
    res.status(httpStatus.OK).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
}

async function getReview(req, res, next) {
  try {
    const review = await reviewService.getReview(req.params.reviewId);
    res.status(httpStatus.OK).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}

async function updateReview(req, res, next) {
  try {
    const userId = requireUser(req);
    const review = await reviewService.updateReview(req.params.reviewId, userId, req.body || {});
    res.status(httpStatus.OK).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}

async function deleteReview(req, res, next) {
  try {
    const userId = requireUser(req);
    const result = await reviewService.deleteReview(req.params.reviewId, userId);
    res.status(httpStatus.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function adminQueue(req, res, next) {
  try {
    requireAdmin(req);
    const reviews = await reviewService.adminQueue({
      status: req.query.status,
      limit: parseInt(req.query.limit, 10) || 100,
      offset: parseInt(req.query.offset, 10) || 0,
    });
    res.status(httpStatus.OK).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
}

async function adminDecision(req, res, next) {
  try {
    requireAdmin(req);
    const adminId = req.headers['x-user-id'] || 'admin';
    const { decision, notes } = req.body;
    const updated = await reviewService.adminDecision(
      req.params.reviewId,
      adminId,
      decision,
      notes || null
    );
    res.status(httpStatus.OK).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReview,
  listReviews,
  getReview,
  updateReview,
  deleteReview,
  adminQueue,
  adminDecision,
};
