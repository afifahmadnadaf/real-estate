'use strict';

const { httpStatus } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

const KEY = 'rate_limits';

async function getRateLimits(req, res, next) {
  try {
    const item = await prisma.runtimeConfig.findUnique({ where: { key: KEY } });
    res.status(httpStatus.OK).json({ success: true, data: item?.value || {} });
  } catch (error) {
    next(error);
  }
}

async function updateRateLimits(req, res, next) {
  try {
    const value = req.body || {};
    const updated = await prisma.runtimeConfig.upsert({
      where: { key: KEY },
      update: { value },
      create: { key: KEY, value },
    });
    res.status(httpStatus.OK).json({ success: true, data: updated.value });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRateLimits,
  updateRateLimits,
};

