'use strict';

const { httpStatus } = require('@real-estate/common');

const templateService = require('../services/template.service');

/**
 * List templates
 */
async function listTemplates(req, res, next) {
  try {
    const filters = {
      isActive: req.query.isActive,
      category: req.query.category,
    };
    const templates = await templateService.listTemplates(filters);
    res.status(httpStatus.OK).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get template
 */
async function getTemplate(req, res, next) {
  try {
    const { id } = req.params;
    const template = await templateService.getTemplate(id);
    res.status(httpStatus.OK).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create template
 */
async function createTemplate(req, res, next) {
  try {
    const template = await templateService.createTemplate(req.body);
    res.status(httpStatus.CREATED).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update template
 */
async function updateTemplate(req, res, next) {
  try {
    const { id } = req.params;
    const template = await templateService.updateTemplate(id, req.body);
    res.status(httpStatus.OK).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete template
 */
async function deleteTemplate(req, res, next) {
  try {
    const { id } = req.params;
    await templateService.deleteTemplate(id);
    res.status(httpStatus.OK).json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
