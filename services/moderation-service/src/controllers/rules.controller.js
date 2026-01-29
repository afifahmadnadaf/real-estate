'use strict';

const { httpStatus } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

/**
 * List moderation rules
 */
async function listRules(req, res, next) {
  try {
    const filters = {
      entityType: req.query.entityType,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    };

    // Remove undefined filters
    Object.keys(filters).forEach((key) => filters[key] === undefined && delete filters[key]);

    const rules = await prisma.moderationRule.findMany({
      where: filters,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    res.status(httpStatus.OK).json({
      success: true,
      data: rules,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create moderation rule
 */
async function createRule(req, res, next) {
  try {
    const { name, description, entityType, conditions, actions, priority, isActive } = req.body;
    const createdById = req.user.id;

    const rule = await prisma.moderationRule.create({
      data: {
        name,
        description,
        entityType,
        conditions,
        actions,
        priority: priority || 0,
        isActive: isActive !== undefined ? isActive : true,
        createdById,
      },
    });

    res.status(httpStatus.CREATED).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update moderation rule
 */
async function updateRule(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, conditions, actions, priority, isActive } = req.body;

    const rule = await prisma.moderationRule.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(conditions !== undefined && { conditions }),
        ...(actions !== undefined && { actions }),
        ...(priority !== undefined && { priority }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.status(httpStatus.OK).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete moderation rule
 */
async function deleteRule(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.moderationRule.delete({
      where: { id },
    });

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Rule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listRules,
  createRule,
  updateRule,
  deleteRule,
};
