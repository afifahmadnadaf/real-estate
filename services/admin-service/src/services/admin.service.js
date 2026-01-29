'use strict';

const { AppError, ErrorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

/**
 * List admin roles
 */
async function listRoles() {
  return prisma.adminRole.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get role by ID
 */
async function getRole(roleId) {
  const role = await prisma.adminRole.findUnique({
    where: { id: roleId },
    include: {
      assignments: {
        where: {
          revokedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!role) {
    throw new AppError('Role not found', ErrorCodes.NOT_FOUND, 404);
  }

  return role;
}

/**
 * Create admin role
 */
async function createRole(data) {
  return prisma.adminRole.create({
    data,
  });
}

/**
 * Update admin role
 */
async function updateRole(roleId, data) {
  const role = await prisma.adminRole.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new AppError('Role not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (role.isSystem) {
    throw new AppError('Cannot modify system role', ErrorCodes.FORBIDDEN, 403);
  }

  return prisma.adminRole.update({
    where: { id: roleId },
    data,
  });
}

/**
 * Delete admin role
 */
async function deleteRole(roleId) {
  const role = await prisma.adminRole.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new AppError('Role not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (role.isSystem) {
    throw new AppError('Cannot delete system role', ErrorCodes.FORBIDDEN, 403);
  }

  return prisma.adminRole.delete({
    where: { id: roleId },
  });
}

/**
 * Assign role to user
 */
async function assignRole(userId, roleId, assignedBy) {
  // Check if already assigned
  const existing = await prisma.adminRoleAssignment.findUnique({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
  });

  if (existing && !existing.revokedAt) {
    throw new AppError('Role already assigned', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (existing && existing.revokedAt) {
    // Re-activate assignment
    return prisma.adminRoleAssignment.update({
      where: { id: existing.id },
      data: {
        revokedAt: null,
        assignedBy,
        assignedAt: new Date(),
      },
    });
  }

  return prisma.adminRoleAssignment.create({
    data: {
      userId,
      roleId,
      assignedBy,
    },
  });
}

/**
 * Revoke role from user
 */
async function revokeRole(userId, roleId, _revokedBy) {
  const assignment = await prisma.adminRoleAssignment.findUnique({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
  });

  if (!assignment || assignment.revokedAt) {
    throw new AppError('Role assignment not found or already revoked', ErrorCodes.NOT_FOUND, 404);
  }

  return prisma.adminRoleAssignment.update({
    where: { id: assignment.id },
    data: {
      revokedAt: new Date(),
    },
  });
}

/**
 * Get user roles
 */
async function getUserRoles(userId) {
  const assignments = await prisma.adminRoleAssignment.findMany({
    where: {
      userId,
      revokedAt: null,
    },
    include: {
      role: true,
    },
  });

  return assignments.map((a) => a.role);
}

/**
 * Check if user has permission
 */
async function hasPermission(userId, permission) {
  const roles = await getUserRoles(userId);

  for (const role of roles) {
    const permissions = role.permissions || {};
    if (permissions[permission] === true) {
      return true;
    }
  }

  return false;
}

/**
 * List known permissions (derived from roles)
 */
async function listPermissions() {
  const roles = await prisma.adminRole.findMany({
    select: { permissions: true },
  });

  const out = new Set();
  for (const role of roles) {
    const perms = role.permissions || {};
    for (const key of Object.keys(perms)) {
      out.add(key);
    }
  }

  return Array.from(out).sort();
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
  hasPermission,
  listPermissions,
};
