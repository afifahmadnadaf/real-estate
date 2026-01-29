'use strict';

const { AppError, errorCodes, httpStatus } = require('@real-estate/common');

const orgService = require('../services/org.service');

/**
 * Create organization
 */
async function createOrg(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }

    const org = await orgService.createOrg(req.app, userId, req.body);

    res.status(httpStatus.CREATED).json({
      success: true,
      data: org,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List organizations
 */
async function listOrgs(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    const result = await orgService.listOrgs(userId, userRole, req.query);

    res.status(httpStatus.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get organization
 */
async function getOrg(req, res, next) {
  try {
    const { orgId } = req.params;
    const userId = req.headers['x-user-id'];

    const org = await orgService.getOrg(orgId, userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: org,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update organization
 */
async function updateOrg(req, res, next) {
  try {
    const { orgId } = req.params;
    const userId = req.headers['x-user-id'];

    const org = await orgService.updateOrg(req.app, orgId, userId, req.body);

    res.status(httpStatus.OK).json({
      success: true,
      data: org,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Approve organization (admin)
 */
async function approveOrg(req, res, next) {
  try {
    const { orgId } = req.params;
    const adminId = req.headers['x-user-id'];

    await orgService.approveOrg(req.app, orgId, adminId);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Organization approved',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject organization (admin)
 */
async function rejectOrg(req, res, next) {
  try {
    const { orgId } = req.params;
    const adminId = req.headers['x-user-id'];
    const { reason } = req.body;

    await orgService.rejectOrg(req.app, orgId, adminId, reason);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Organization rejected',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Request changes (admin)
 */
async function requestChanges(req, res, next) {
  try {
    const { orgId } = req.params;
    const adminId = req.headers['x-user-id'];
    const { changes } = req.body;

    await orgService.requestChanges(req.app, orgId, adminId, changes);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Changes requested',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload organization logo
 */
async function uploadLogo(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    const { orgId } = req.params;
    const { mediaId } = req.body;

    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }

    const org = await orgService.uploadLogo(orgId, userId, mediaId);

    res.status(httpStatus.OK).json({
      success: true,
      data: org,
      message: 'Logo uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrg,
  listOrgs,
  getOrg,
  updateOrg,
  uploadLogo,
  approveOrg,
  rejectOrg,
  requestChanges,
};
