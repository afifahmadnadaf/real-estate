'use strict';

const { AppError, errorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

async function listEntries(filters = {}) {
  const where = {};
  if (filters.entryType) {
    where.entryType = filters.entryType;
  }
  if (filters.query) {
    where.value = { contains: filters.query, mode: 'insensitive' };
  }
  return prisma.blacklistEntry.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 100,
    skip: filters.offset || 0,
  });
}

async function createEntry(data, adminId) {
  return prisma.blacklistEntry.create({
    data: {
      entryType: data.entryType,
      value: data.value,
      reason: data.reason,
      severity: data.severity || 'MEDIUM',
      expiresAt: data.expiresAt || null,
      createdById: adminId,
    },
  });
}

async function getEntry(entryId) {
  const entry = await prisma.blacklistEntry.findUnique({ where: { id: entryId } });
  if (!entry) {
    throw new AppError('Blacklist entry not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }
  return entry;
}

async function updateEntry(entryId, data) {
  return prisma.blacklistEntry.update({
    where: { id: entryId },
    data: {
      reason: data.reason,
      severity: data.severity,
      expiresAt: data.expiresAt,
    },
  });
}

async function deleteEntry(entryId) {
  const existing = await prisma.blacklistEntry.findUnique({ where: { id: entryId } });
  if (!existing) {
    throw new AppError('Blacklist entry not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }
  await prisma.blacklistEntry.delete({ where: { id: entryId } });
  return { success: true };
}

module.exports = {
  listEntries,
  createEntry,
  getEntry,
  updateEntry,
  deleteEntry,
};
