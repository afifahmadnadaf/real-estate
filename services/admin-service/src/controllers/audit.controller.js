'use strict';

const { httpStatus } = require('@real-estate/common');

const auditService = require('../services/audit.service');

/**
 * List audit logs
 */
async function listAuditLogs(req, res, next) {
  try {
    const filters = {
      actorId: req.query.actorId,
      actorType: req.query.actorType,
      action: req.query.action,
      resourceType: req.query.resourceType,
      resourceId: req.query.resourceId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const options = {
      limit: parseInt(req.query.limit, 10) || 50,
      offset: parseInt(req.query.offset, 10) || 0,
    };

    const result = await auditService.listAuditLogs(filters, options);

    res.status(httpStatus.OK).json({
      success: true,
      data: result.logs,
      meta: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get audit log
 */
async function getAuditLog(req, res, next) {
  try {
    const { id } = req.params;
    const log = await auditService.getAuditLog(id);
    res.status(httpStatus.OK).json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Export audit logs (basic JSON export)
 */
async function exportAuditLogs(req, res, next) {
  try {
    const filters = req.body || {};
    const result = await auditService.listAuditLogs(filters, {
      limit: Math.min(parseInt(filters.limit, 10) || 10000, 50000),
      offset: parseInt(filters.offset, 10) || 0,
    });

    res.status(httpStatus.OK).json({
      success: true,
      data: result.logs,
      meta: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listAuditLogs,
  getAuditLog,
  exportAuditLogs,
};
