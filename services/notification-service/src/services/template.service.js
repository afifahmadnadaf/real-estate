'use strict';

const { AppError, ErrorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

/**
 * List templates
 */
async function listTemplates(filters = {}) {
  const where = {};
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive === 'true';
  }
  if (filters.category) {
    where.category = filters.category;
  }

  return prisma.notificationTemplate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get template
 */
async function getTemplate(templateId) {
  const template = await prisma.notificationTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new AppError('Template not found', ErrorCodes.NOT_FOUND, 404);
  }

  return template;
}

/**
 * Create template
 */
async function createTemplate(data) {
  // Check if code already exists
  const existing = await prisma.notificationTemplate.findUnique({
    where: { code: data.code },
  });

  if (existing) {
    throw new AppError('Template code already exists', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return prisma.notificationTemplate.create({
    data,
  });
}

/**
 * Update template
 */
async function updateTemplate(templateId, data) {
  const template = await prisma.notificationTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new AppError('Template not found', ErrorCodes.NOT_FOUND, 404);
  }

  return prisma.notificationTemplate.update({
    where: { id: templateId },
    data,
  });
}

/**
 * Delete template
 */
async function deleteTemplate(templateId) {
  const template = await prisma.notificationTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new AppError('Template not found', ErrorCodes.NOT_FOUND, 404);
  }

  return prisma.notificationTemplate.delete({
    where: { id: templateId },
  });
}

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
