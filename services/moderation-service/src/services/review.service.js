'use strict';

const { AppError, errorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

async function createReview(authorId, data) {
  const review = await prisma.review.create({
    data: {
      authorId,
      entityType: data.entityType,
      entityId: data.entityId,
      rating: data.rating,
      title: data.title || null,
      body: data.body || null,
      metadata: data.metadata || null,
    },
  });
  return review;
}

async function listReviews(filters = {}) {
  const where = {};
  if (filters.entityType) {
    where.entityType = filters.entityType;
  }
  if (filters.entityId) {
    where.entityId = filters.entityId;
  }
  if (filters.status) {
    where.status = filters.status;
  } else {
    where.status = 'APPROVED';
  }
  return prisma.review.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 50,
    skip: filters.offset || 0,
  });
}

async function getReview(reviewId) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new AppError('Review not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }
  if (review.status !== 'APPROVED') {
    throw new AppError('Review not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }
  return review;
}

async function updateReview(reviewId, authorId, data) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new AppError('Review not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }
  if (review.authorId !== authorId) {
    throw new AppError('Forbidden', 403, errorCodes.AUTHORIZATION.FORBIDDEN);
  }
  return prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: typeof data.rating === 'number' ? data.rating : undefined,
      title: Object.prototype.hasOwnProperty.call(data, 'title') ? data.title : undefined,
      body: Object.prototype.hasOwnProperty.call(data, 'body') ? data.body : undefined,
      metadata: Object.prototype.hasOwnProperty.call(data, 'metadata') ? data.metadata : undefined,
      status: 'PENDING',
    },
  });
}

async function deleteReview(reviewId, authorId) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new AppError('Review not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }
  if (review.authorId !== authorId) {
    throw new AppError('Forbidden', 403, errorCodes.AUTHORIZATION.FORBIDDEN);
  }
  await prisma.review.delete({ where: { id: reviewId } });
  return { success: true };
}

async function adminQueue(filters = {}) {
  const where = {};
  if (filters.status) {
    where.status = filters.status;
  }
  return prisma.review.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 100,
    skip: filters.offset || 0,
  });
}

async function adminDecision(reviewId, adminId, decision, notes = null) {
  const status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  return prisma.review.update({
    where: { id: reviewId },
    data: {
      status,
      metadata: {
        adminDecision: status,
        adminId,
        notes,
        decidedAt: new Date().toISOString(),
      },
    },
  });
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
