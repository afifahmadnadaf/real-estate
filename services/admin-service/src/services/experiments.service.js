'use strict';

const crypto = require('crypto');

const { AppError, errorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

function pickVariant(variants, subject) {
  const weights = variants && typeof variants === 'object' ? variants : { A: 50, B: 50 };
  const keys = Object.keys(weights);
  const total = keys.reduce((sum, k) => sum + Number(weights[k] || 0), 0) || 100;
  const hash = crypto.createHash('sha256').update(String(subject)).digest('hex');
  const bucket = parseInt(hash.slice(0, 8), 16) % total;
  let cursor = 0;
  for (const k of keys) {
    cursor += Number(weights[k] || 0);
    if (bucket < cursor) {
      return k;
    }
  }
  return keys[0] || 'A';
}

async function listExperiments(filters = {}) {
  const where = {};
  if (filters.status) {
    where.status = filters.status;
  }
  return prisma.experiment.findMany({
    where,
    orderBy: { key: 'asc' },
  });
}

async function upsertExperiment(data) {
  return prisma.experiment.upsert({
    where: { key: data.key },
    update: {
      description: data.description,
      status: data.status,
      variants: data.variants,
      rules: data.rules,
      startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
    },
    create: {
      key: data.key,
      description: data.description || null,
      status: data.status || 'ACTIVE',
      variants: data.variants || { A: 50, B: 50 },
      rules: data.rules || null,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
    },
  });
}

async function getAssignment(key, subject) {
  const experiment = await prisma.experiment.findUnique({ where: { key } });
  if (!experiment || experiment.status !== 'ACTIVE') {
    throw new AppError('Experiment not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }
  const variant = pickVariant(experiment.variants, subject);
  return { experimentKey: key, variant };
}

async function logExposure(key, data) {
  const experiment = await prisma.experiment.findUnique({ where: { key } });
  if (!experiment) {
    throw new AppError('Experiment not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }
  return prisma.experimentExposure.create({
    data: {
      experimentId: experiment.id,
      userId: data.userId || null,
      deviceId: data.deviceId || null,
      variant: data.variant,
      metadata: data.metadata || null,
    },
  });
}

async function deleteExperiment(expIdOrKey) {
  const byId = await prisma.experiment.findUnique({ where: { id: expIdOrKey } }).catch(() => null);
  const experiment = byId || (await prisma.experiment.findUnique({ where: { key: expIdOrKey } }).catch(() => null));
  if (!experiment) {
    throw new AppError('Experiment not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }
  await prisma.experiment.delete({ where: { id: experiment.id } });
  return { success: true };
}

module.exports = {
  listExperiments,
  upsertExperiment,
  getAssignment,
  logExposure,
  deleteExperiment,
};
