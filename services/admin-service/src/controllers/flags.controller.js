'use strict';

const { httpStatus } = require('@real-estate/common');

const flagsService = require('../services/flags.service');

async function listFlags(req, res, next) {
  try {
    const flags = await flagsService.listFlags();
    res.status(httpStatus.OK).json({ success: true, data: flags });
  } catch (error) {
    next(error);
  }
}

async function getFlag(req, res, next) {
  try {
    const flag = await flagsService.getFlag(req.params.key);
    res.status(httpStatus.OK).json({ success: true, data: flag });
  } catch (error) {
    next(error);
  }
}

async function upsertFlag(req, res, next) {
  try {
    const flag = await flagsService.upsertFlag({
      ...req.body,
      key: req.body.key || req.params.key,
    });
    res.status(httpStatus.OK).json({ success: true, data: flag });
  } catch (error) {
    next(error);
  }
}

async function deleteFlag(req, res, next) {
  try {
    const result = await flagsService.deleteFlag(req.params.key);
    res.status(httpStatus.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listFlags,
  getFlag,
  upsertFlag,
  deleteFlag,
};
