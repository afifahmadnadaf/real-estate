'use strict';

const { AppError, errorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

async function listFlags() {
  return prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
}

async function getFlag(key) {
  const flag = await prisma.featureFlag.findUnique({ where: { key } });
  if (!flag) {
    throw new AppError('Flag not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }
  return flag;
}

async function upsertFlag(data) {
  return prisma.featureFlag.upsert({
    where: { key: data.key },
    update: {
      description: data.description,
      enabled: data.enabled,
      rules: data.rules,
    },
    create: {
      key: data.key,
      description: data.description || null,
      enabled: data.enabled !== undefined ? data.enabled : false,
      rules: data.rules || null,
    },
  });
}

async function deleteFlag(key) {
  await prisma.featureFlag.delete({ where: { key } });
  return { success: true };
}

module.exports = {
  listFlags,
  getFlag,
  upsertFlag,
  deleteFlag,
};
