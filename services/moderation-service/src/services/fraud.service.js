'use strict';

const { prisma } = require('@real-estate/db-models');

async function listSignals(filters = {}) {
  const where = {};
  if (filters.entityType) {
    where.entityType = filters.entityType;
  }
  if (filters.entityId) {
    where.entityId = filters.entityId;
  }
  const counts = await prisma.report.groupBy({
    by: ['entityType', 'entityId'],
    where: Object.keys(where).length ? where : undefined,
    _count: { _all: true },
    take: filters.limit || 100,
  });
  return counts.map((c) => ({
    entityType: c.entityType,
    entityId: c.entityId,
    reportCount: c._count._all,
    signal: c._count._all >= 5 ? 'HIGH_REPORT_VOLUME' : 'REPORT_VOLUME',
  }));
}

async function getScore(entityType, entityId) {
  const count = await prisma.report.count({
    where: { entityType, entityId },
  });
  const score = Math.min(100, count * 10);
  return { entityType, entityId, score, reportCount: count };
}

module.exports = {
  listSignals,
  getScore,
};
