'use strict';

const { httpStatus } = require('@real-estate/common');

const packageService = require('../services/package.service');

/**
 * List packages
 */
async function listPackages(req, res, next) {
  try {
    const filters = {
      type: req.query.type,
      isActive: req.query.isActive,
    };
    const packages = await packageService.listPackages(filters);
    res.status(httpStatus.OK).json({
      success: true,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get package
 */
async function getPackage(req, res, next) {
  try {
    const { id } = req.params;
    const pkg = await packageService.getPackage(id);
    res.status(httpStatus.OK).json({
      success: true,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create package (admin)
 */
async function createPackage(req, res, next) {
  try {
    const pkg = await packageService.createPackage(req.body);
    res.status(httpStatus.CREATED).json({
      success: true,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update package (admin)
 */
async function updatePackage(req, res, next) {
  try {
    const { id } = req.params;
    const pkg = await packageService.updatePackage(id, req.body);
    res.status(httpStatus.OK).json({
      success: true,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete package (admin)
 */
async function deletePackage(req, res, next) {
  try {
    const { id } = req.params;
    await packageService.deletePackage(id);
    res.status(httpStatus.OK).json({
      success: true,
      message: 'Package deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listPackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage,
};
