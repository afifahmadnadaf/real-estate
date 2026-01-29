'use strict';

const { AppError, errorCodes, httpStatus } = require('@real-estate/common');

const fraudService = require('../services/fraud.service');

function requireAdmin(req) {
  const role = req.headers['x-user-role'];
  if (role !== 'ADMIN') {
    throw new AppError('Forbidden', 403, errorCodes.AUTHORIZATION.FORBIDDEN);
  }
}

async function listSignals(req, res, next) {
  try {
    requireAdmin(req);
    const signals = await fraudService.listSignals({
      entityType: req.query.entityType,
      entityId: req.query.entityId,
      limit: parseInt(req.query.limit, 10) || 100,
    });
    res.status(httpStatus.OK).json({ success: true, data: signals });
  } catch (error) {
    next(error);
  }
}

async function getScore(req, res, next) {
  try {
    requireAdmin(req);
    const { entityType, entityId } = req.query;
    const score = await fraudService.getScore(entityType, entityId);
    res.status(httpStatus.OK).json({ success: true, data: score });
  } catch (error) {
    next(error);
  }
}

async function recomputeScore(req, res, next) {
  try {
    requireAdmin(req);
    const { entityType, entityId } = req.body || {};
    if (!entityType || !entityId) {
      throw new AppError('entityType and entityId required', 400, errorCodes.VALIDATION.VALIDATION_ERROR);
    }
    const score = await fraudService.getScore(entityType, entityId);
    res.status(httpStatus.OK).json({ success: true, data: score });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listSignals,
  getScore,
  recomputeScore,
};
