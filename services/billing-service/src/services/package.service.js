'use strict';

const { AppError, ErrorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

/**
 * List packages
 */
async function listPackages(filters = {}) {
  const where = {
    isActive: filters.isActive !== undefined ? filters.isActive : true,
  };

  if (filters.type) {
    where.type = filters.type;
  }

  return prisma.package.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Get package by ID
 */
async function getPackage(packageId) {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!pkg) {
    throw new AppError('Package not found', ErrorCodes.NOT_FOUND, 404);
  }

  return pkg;
}

/**
 * Create package (admin)
 */
async function createPackage(data) {
  return prisma.package.create({
    data,
  });
}

/**
 * Update package (admin)
 */
async function updatePackage(packageId, data) {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!pkg) {
    throw new AppError('Package not found', ErrorCodes.NOT_FOUND, 404);
  }

  return prisma.package.update({
    where: { id: packageId },
    data,
  });
}

/**
 * Delete package (admin)
 */
async function deletePackage(packageId) {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!pkg) {
    throw new AppError('Package not found', ErrorCodes.NOT_FOUND, 404);
  }

  // Soft delete by setting isActive to false
  return prisma.package.update({
    where: { id: packageId },
    data: { isActive: false },
  });
}

module.exports = {
  listPackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage,
};
