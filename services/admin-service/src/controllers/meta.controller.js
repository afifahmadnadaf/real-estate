'use strict';

const { httpStatus } = require('@real-estate/common');

const metaService = require('../services/meta.service');

async function listCategory(req, res, next) {
  try {
    const items = await metaService.listCategory(req.params.category);
    res.status(httpStatus.OK).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
}

async function adminList(req, res, next) {
  try {
    const items = await metaService.adminList(req.params.category);
    res.status(httpStatus.OK).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
}

async function adminCreate(req, res, next) {
  try {
    const item = await metaService.adminCreate(req.params.category, req.body);
    res.status(httpStatus.CREATED).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

async function adminUpdate(req, res, next) {
  try {
    const item = await metaService.adminUpdate(req.params.id, req.body);
    res.status(httpStatus.OK).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

async function adminDelete(req, res, next) {
  try {
    const result = await metaService.adminDelete(req.params.id);
    res.status(httpStatus.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCategory,
  adminList,
  adminCreate,
  adminUpdate,
  adminDelete,
};
