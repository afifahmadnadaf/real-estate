'use strict';

const { httpStatus } = require('@real-estate/common');

const adminService = require('../services/admin.service');

/**
 * List roles
 */
async function listRoles(req, res, next) {
  try {
    const roles = await adminService.listRoles();
    res.status(httpStatus.OK).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get role
 */
async function getRole(req, res, next) {
  try {
    const { id } = req.params;
    const role = await adminService.getRole(id);
    res.status(httpStatus.OK).json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create role
 */
async function createRole(req, res, next) {
  try {
    const role = await adminService.createRole(req.body);
    res.status(httpStatus.CREATED).json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update role
 */
async function updateRole(req, res, next) {
  try {
    const { id } = req.params;
    const role = await adminService.updateRole(id, req.body);
    res.status(httpStatus.OK).json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete role
 */
async function deleteRole(req, res, next) {
  try {
    const { id } = req.params;
    await adminService.deleteRole(id);
    res.status(httpStatus.OK).json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Assign role
 */
async function assignRole(req, res, next) {
  try {
    const { userId, roleId } = req.body;
    const assignedBy = req.user.id;
    const assignment = await adminService.assignRole(userId, roleId, assignedBy);
    res.status(httpStatus.CREATED).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Revoke role
 */
async function revokeRole(req, res, next) {
  try {
    const { userId, roleId } = req.body;
    const revokedBy = req.user.id;
    const assignment = await adminService.revokeRole(userId, roleId, revokedBy);
    res.status(httpStatus.OK).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user roles
 */
async function getUserRoles(req, res, next) {
  try {
    const { userId } = req.params;
    const roles = await adminService.getUserRoles(userId);
    res.status(httpStatus.OK).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List permissions
 */
async function listPermissions(req, res, next) {
  try {
    const permissions = await adminService.listPermissions();
    res.status(httpStatus.OK).json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Assign roles to user (spec endpoint)
 */
async function assignUserRole(req, res, next) {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;
    const assignedBy = req.user.id;
    const assignment = await adminService.assignRole(userId, roleId, assignedBy);
    res.status(httpStatus.CREATED).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove role from user (spec endpoint)
 */
async function removeUserRole(req, res, next) {
  try {
    const { userId, roleId } = req.params;
    const assignment = await adminService.revokeRole(userId, roleId, req.user.id);
    res.status(httpStatus.OK).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Internal: Check if user has a permission
 */
async function checkPermission(req, res, next) {
  try {
    const { userId, permission } = req.body;

    if (!userId || !permission) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ success: false, message: 'userId and permission required' });
    }

    const allowed = await adminService.hasPermission(userId, permission);

    res.status(httpStatus.OK).json({ success: true, allowed });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  assignRole,
  revokeRole,
  getUserRoles,
  listPermissions,
  assignUserRole,
  removeUserRole,
  checkPermission,
};
