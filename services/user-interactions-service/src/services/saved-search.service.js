'use strict';

const { AppError, ErrorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

/**
 * List user's saved searches
 */
async function listSavedSearches(userId, options = {}) {
  const { limit = 20, offset = 0 } = options;

  const [searches, total] = await Promise.all([
    prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.savedSearch.count({ where: { userId } }),
  ]);

  return {
    searches,
    total,
    limit,
    offset,
  };
}

/**
 * Create saved search
 */
async function createSavedSearch(userId, data) {
  const search = await prisma.savedSearch.create({
    data: {
      userId,
      name: data.name,
      filters: data.filters,
      alertEnabled: data.alertEnabled || false,
      alertFrequency: data.alertFrequency || null,
    },
  });

  return search;
}

/**
UI * Get saved search
 */
async function getSavedSearch(userId, searchId) {
  const search = await prisma.savedSearch.findUnique({
    where: { id: searchId },
  });

  if (!search) {
    throw new AppError('Saved search not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (search.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  return search;
}

/**
 * Update saved search
 */
async function updateSavedSearch(userId, searchId, data) {
  const search = await prisma.savedSearch.findUnique({
    where: { id: searchId },
  });

  if (!search) {
    throw new AppError('Saved search not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (search.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  const updated = await prisma.savedSearch.update({
    where: { id: searchId },
    data: {
      name: data.name,
      filters: data.filters,
      alertEnabled: data.alertEnabled,
      alertFrequency: data.alertFrequency,
    },
  });

  return updated;
}

/**
 * Delete saved search
 */
async function deleteSavedSearch(userId, searchId) {
  const search = await prisma.savedSearch.findUnique({
    where: { id: searchId },
  });

  if (!search) {
    throw new AppError('Saved search not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (search.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  await prisma.savedSearch.delete({
    where: { id: searchId },
  });

  return { success: true };
}

module.exports = {
  listSavedSearches,
  createSavedSearch,
  getSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
};
