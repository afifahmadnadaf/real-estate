'use strict';

const { AppError, errorCodes, httpStatus } = require('@real-estate/common');

const reportService = require('../services/report.service');

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

async function createReport(req, res, next) {
  try {
    const userId = requireUser(req);
    const report = await reportService.createReport(userId, req.body);
    res.status(httpStatus.CREATED).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

async function listReports(req, res, next) {
  try {
    const userId = requireUser(req);
    const reports = await reportService.listReports(userId, {
      status: req.query.status,
      limit: parseInt(req.query.limit, 10) || 50,
      offset: parseInt(req.query.offset, 10) || 0,
    });
    res.status(httpStatus.OK).json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
}

async function getReport(req, res, next) {
  try {
    const userId = requireUser(req);
    const report = await reportService.getReport(userId, req.params.reportId);
    res.status(httpStatus.OK).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

async function adminQueue(req, res, next) {
  try {
    requireAdmin(req);
    const reports = await reportService.adminListQueue({
      status: req.query.status,
      entityType: req.query.entityType,
      limit: parseInt(req.query.limit, 10) || 100,
      offset: parseInt(req.query.offset, 10) || 0,
    });
    res.status(httpStatus.OK).json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
}

async function adminDecision(req, res, next) {
  try {
    requireAdmin(req);
    const adminId = req.headers['x-user-id'] || 'admin';
    const { decision, resolution } = req.body;
    const updated = await reportService.adminDecide(req.params.reportId, adminId, {
      decision,
      resolution,
    });
    res.status(httpStatus.OK).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReport,
  listReports,
  getReport,
  adminQueue,
  adminDecision,
};
