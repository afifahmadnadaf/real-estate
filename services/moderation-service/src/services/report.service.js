'use strict';

const { AppError, errorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

async function createReport(reporterId, data) {
  const report = await prisma.report.create({
    data: {
      reporterId,
      entityType: data.entityType,
      entityId: data.entityId,
      reason: data.reason,
      description: data.description || null,
      evidenceUrls: data.evidenceUrls || [],
    },
  });
  return report;
}

async function listReports(reporterId, filters = {}) {
  const where = { reporterId };
  if (filters.status) {
    where.status = filters.status;
  }
  return prisma.report.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 50,
    skip: filters.offset || 0,
  });
}

async function getReport(reporterId, reportId) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) {
    throw new AppError('Report not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }
  if (report.reporterId !== reporterId) {
    throw new AppError('Forbidden', 403, errorCodes.AUTHORIZATION.FORBIDDEN);
  }
  return report;
}

async function adminListQueue(filters = {}) {
  const where = {};
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.entityType) {
    where.entityType = filters.entityType;
  }
  return prisma.report.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 100,
    skip: filters.offset || 0,
  });
}

async function adminDecide(reportId, adminId, decision) {
  const status = decision.decision === 'RESOLVE' ? 'RESOLVED' : 'REJECTED';
  return prisma.report.update({
    where: { id: reportId },
    data: {
      status,
      resolution: decision.resolution || null,
      resolvedById: adminId,
      resolvedAt: new Date(),
    },
  });
}

module.exports = {
  createReport,
  listReports,
  getReport,
  adminListQueue,
  adminDecide,
};
