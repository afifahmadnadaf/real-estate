'use strict';

const { AppError, errorCodes, httpStatus } = require('@real-estate/common');

const blacklistService = require('../services/blacklist.service');

function requireAdmin(req) {
  const role = req.headers['x-user-role'];
  if (role !== 'ADMIN') {
    throw new AppError('Forbidden', 403, errorCodes.AUTHORIZATION.FORBIDDEN);
  }
}

async function listEntries(req, res, next) {
  try {
    requireAdmin(req);
    const entries = await blacklistService.listEntries({
      entryType: req.query.entryType,
      query: req.query.q,
      limit: parseInt(req.query.limit, 10) || 100,
      offset: parseInt(req.query.offset, 10) || 0,
    });
    res.status(httpStatus.OK).json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
}

async function createEntry(req, res, next) {
  try {
    requireAdmin(req);
    const adminId = req.headers['x-user-id'] || 'admin';
    const entry = await blacklistService.createEntry(req.body, adminId);
    res.status(httpStatus.CREATED).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
}

async function getEntry(req, res, next) {
  try {
    requireAdmin(req);
    const entry = await blacklistService.getEntry(req.params.entryId);
    res.status(httpStatus.OK).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
}

async function updateEntry(req, res, next) {
  try {
    requireAdmin(req);
    const entry = await blacklistService.updateEntry(req.params.entryId, req.body);
    res.status(httpStatus.OK).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
}

async function deleteEntry(req, res, next) {
  try {
    requireAdmin(req);
    await blacklistService.deleteEntry(req.params.entryId);
    res.status(httpStatus.OK).json({ success: true, message: 'Deleted' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listEntries,
  createEntry,
  getEntry,
  updateEntry,
  deleteEntry,
};
