'use strict';

const { AppError, errorCodes, httpStatus } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

async function createJob(req, res, next, type) {
  try {
    const job = await prisma.bulkJob.create({
      data: {
        type,
        status: 'PENDING',
        input: req.body || null,
      },
    });
    res.status(httpStatus.CREATED).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
}

async function importProperties(req, res, next) {
  return createJob(req, res, next, 'PROPERTY_IMPORT');
}

async function importProjects(req, res, next) {
  return createJob(req, res, next, 'PROJECT_IMPORT');
}

async function exportProperties(req, res, next) {
  return createJob(req, res, next, 'PROPERTY_EXPORT');
}

async function listJobs(req, res, next) {
  try {
    const where = {};
    if (req.query.type) where.type = String(req.query.type);
    if (req.query.status) where.status = String(req.query.status);
    const jobs = await prisma.bulkJob.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: { createdAt: 'desc' },
      take: parseInt(req.query.limit, 10) || 100,
      skip: parseInt(req.query.offset, 10) || 0,
    });
    res.status(httpStatus.OK).json({ success: true, data: jobs });
  } catch (error) {
    next(error);
  }
}

async function getJob(req, res, next) {
  try {
    const job = await prisma.bulkJob.findUnique({ where: { id: req.params.jobId } });
    if (!job) {
      throw new AppError('Job not found', 404, errorCodes.RESOURCE.NOT_FOUND);
    }
    res.status(httpStatus.OK).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
}

async function getErrors(req, res, next) {
  try {
    const job = await prisma.bulkJob.findUnique({ where: { id: req.params.jobId } });
    if (!job) {
      throw new AppError('Job not found', 404, errorCodes.RESOURCE.NOT_FOUND);
    }
    res.status(httpStatus.OK).json({ success: true, data: { errorUrl: job.errorUrl || null } });
  } catch (error) {
    next(error);
  }
}

async function getExportStatus(req, res, next) {
  try {
    const job = await prisma.bulkJob.findUnique({ where: { id: req.params.exportId } });
    if (!job) {
      throw new AppError('Export not found', 404, errorCodes.RESOURCE.NOT_FOUND);
    }
    res.status(httpStatus.OK).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  importProperties,
  importProjects,
  exportProperties,
  listJobs,
  getJob,
  getErrors,
  getExportStatus,
};

