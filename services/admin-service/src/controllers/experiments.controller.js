'use strict';

const { AppError, errorCodes, httpStatus } = require('@real-estate/common');

const experimentsService = require('../services/experiments.service');

async function listExperiments(req, res, next) {
  try {
    const subject = req.user?.id || req.query.deviceId || req.headers['x-device-id'];
    if (!subject) {
      throw new AppError('Subject required', 400, errorCodes.VALIDATION.VALIDATION_ERROR);
    }
    const experiments = await experimentsService.listExperiments({ status: 'ACTIVE' });
    const assignments = [];
    for (const exp of experiments) {
      try {
        const a = await experimentsService.getAssignment(exp.key, subject);
        assignments.push(a);
      } catch {
        void 0;
      }
    }
    res.status(httpStatus.OK).json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
}

async function getAssignment(req, res, next) {
  try {
    const subject = req.user?.id || req.query.deviceId || req.headers['x-device-id'];
    if (!subject) {
      throw new AppError('Subject required', 400, errorCodes.VALIDATION.VALIDATION_ERROR);
    }
    const assignment = await experimentsService.getAssignment(req.params.key, subject);
    res.status(httpStatus.OK).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
}

async function logExposure(req, res, next) {
  try {
    const exposure = await experimentsService.logExposure(req.params.key, {
      userId: req.user?.id || null,
      deviceId: req.body.deviceId || null,
      variant: req.body.variant,
      metadata: req.body.metadata || null,
    });
    res.status(httpStatus.CREATED).json({ success: true, data: exposure });
  } catch (error) {
    next(error);
  }
}

async function logExposureUnified(req, res, next) {
  try {
    const key = req.body?.key;
    if (!key) {
      throw new AppError('key required', 400, errorCodes.VALIDATION.VALIDATION_ERROR);
    }
    const exposure = await experimentsService.logExposure(key, {
      userId: req.user?.id || null,
      deviceId: req.body.deviceId || null,
      variant: req.body.variant,
      metadata: req.body.metadata || null,
    });
    res.status(httpStatus.CREATED).json({ success: true, data: exposure });
  } catch (error) {
    next(error);
  }
}

async function adminList(req, res, next) {
  try {
    const experiments = await experimentsService.listExperiments({ status: req.query.status });
    res.status(httpStatus.OK).json({ success: true, data: experiments });
  } catch (error) {
    next(error);
  }
}

async function adminUpsert(req, res, next) {
  try {
    const exp = await experimentsService.upsertExperiment({
      ...req.body,
      key: req.body.key || req.params.key,
    });
    res.status(httpStatus.OK).json({ success: true, data: exp });
  } catch (error) {
    next(error);
  }
}

async function adminDelete(req, res, next) {
  try {
    const result = await experimentsService.deleteExperiment(req.params.expId);
    res.status(httpStatus.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listExperiments,
  getAssignment,
  logExposure,
  logExposureUnified,
  adminList,
  adminUpsert,
  adminDelete,
};
