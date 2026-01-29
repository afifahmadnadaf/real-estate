'use strict';

const { AppError, ErrorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

/**
 * List user's shortlisted properties
 */
async function listShortlists(userId, options = {}) {
  const { limit = 20, offset = 0 } = options;

  const [shortlists, total] = await Promise.all([
    prisma.shortlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.shortlist.count({ where: { userId } }),
  ]);

  return {
    shortlists,
    total,
    limit,
    offset,
  };
}

/**
 * Add property to shortlist
 */
async function addToShortlist(userId, propertyId) {
  // Check if already shortlisted
  const existing = await prisma.shortlist.findUnique({
    where: {
      userId_propertyId: {
        userId,
        propertyId,
      },
    },
  });

  if (existing) {
    throw new AppError('Property already in shortlist', ErrorCodes.ALREADY_EXISTS, 409);
  }

  const shortlist = await prisma.shortlist.create({
    data: {
      userId,
      propertyId,
    },
  });

  return shortlist;
}

/**
 * Remove property from shortlist
 */
async function removeFromShortlist(userId, shortlistId) {
  const shortlist = await prisma.shortlist.findUnique({
    where: { id: shortlistId },
  });

  if (!shortlist) {
    throw new AppError('Shortlist not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (shortlist.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  await prisma.shortlist.delete({
    where: { id: shortlistId },
  });

  return { success: true };
}

/**
 * Bulk add/remove from shortlist
 */
async function bulkUpdateShortlist(userId, propertyIds, action) {
  if (action === 'add') {
    // Add all properties (ignore duplicates)
    await prisma.shortlist.createMany({
      data: propertyIds.map((propertyId) => ({
        userId,
        propertyId,
      })),
      skipDuplicates: true,
    });
  } else if (action === 'remove') {
    // Remove all properties
    await prisma.shortlist.deleteMany({
      where: {
        userId,
        propertyId: { in: propertyIds },
      },
    });
  }

  return { success: true, action, count: propertyIds.length };
}

module.exports = {
  listShortlists,
  addToShortlist,
  removeFromShortlist,
  bulkUpdateShortlist,
};
