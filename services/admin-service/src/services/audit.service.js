'use strict';

const { prisma } = require('@real-estate/db-models');

/**
 * Create audit log entry
 */
async function createAuditLog(data) {
  return prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorType: data.actorType || 'SYSTEM',
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      changes: data.changes || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      metadata: data.metadata || null,
    },
  });
}

/**
 * List audit logs
 */
async function listAuditLogs(filters = {}, options = {}) {
  const {
    actorId,
    actorType,
    action,
    resourceType,
    resourceId,
    limit = 50,
    offset = 0,
    startDate,
    endDate,
  } = { ...filters, ...options };

  const where = {};
  if (actorId) {
    where.actorId = actorId;
  }
  if (actorType) {
    where.actorType = actorType;
  }
  if (action) {
    where.action = action;
  }
  if (resourceType) {
    where.resourceType = resourceType;
  }
  if (resourceId) {
    where.resourceId = resourceId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    limit,
    offset,
  };
}

/**
 * Get audit log by ID
 */
async function getAuditLog(logId) {
  return prisma.auditLog.findUnique({
    where: { id: logId },
  });
}

module.exports = {
  createAuditLog,
  listAuditLogs,
  getAuditLog,
};
