'use strict';

const crypto = require('crypto');

const { AppError, ErrorCodes } = require('@real-estate/common');
const { prisma, ProjectModel } = require('@real-estate/db-models');

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function newUnitId() {
  return crypto.randomUUID();
}

function normalizeMediaKind(input) {
  const v = String(input || 'images').toLowerCase();
  if (v === 'videos') return 'videos';
  if (v === 'floorplans' || v === 'floor-plans' || v === 'floor_plans') return 'floorPlans';
  return 'images';
}

async function createProject(orgId, data) {
  const slug = data.slug || `${slugify(data.name)}-${crypto.randomBytes(4).toString('hex')}`;
  const project = await ProjectModel.create({
    orgId,
    name: data.name,
    slug,
    overview: data.overview || {},
    configurations: data.configurations || [],
    pricing: data.pricing || {},
    location: data.location || {},
    amenities: data.amenities || {},
    specifications: data.specifications || {},
    developer: data.developer || {},
    media: data.media || {},
    verification: data.verification || {},
    premium: data.premium || {},
    status: 'DRAFT',
  });
  return project.toJSON();
}

async function listProjects(orgId, filters = {}) {
  const query = { orgId };
  if (filters.status) {
    query.status = filters.status;
  }
  const items = await ProjectModel.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit || 50)
    .skip(filters.offset || 0)
    .exec();
  return items.map((p) => p.toJSON());
}

async function getProject(orgId, projectId) {
  const project = await ProjectModel.findOne({ _id: projectId, orgId }).exec();
  if (!project) {
    throw new AppError('Project not found', 404, ErrorCodes.NOT_FOUND);
  }
  return project.toJSON();
}

async function updateProject(orgId, projectId, data) {
  const project = await ProjectModel.findOneAndUpdate(
    { _id: projectId, orgId },
    { $set: data, $inc: { version: 1 } },
    { new: true }
  ).exec();
  if (!project) {
    throw new AppError('Project not found', 404, ErrorCodes.NOT_FOUND);
  }
  return project.toJSON();
}

async function deleteProject(orgId, projectId) {
  const project = await ProjectModel.findOneAndUpdate(
    { _id: projectId, orgId },
    { $set: { status: 'ARCHIVED' }, $inc: { version: 1 } },
    { new: true }
  ).exec();
  if (!project) {
    throw new AppError('Project not found', 404, ErrorCodes.NOT_FOUND);
  }
  return project.toJSON();
}

async function submitProject(orgId, projectId) {
  return updateProject(orgId, projectId, { status: 'SUBMITTED' });
}

async function publishProject(orgId, projectId) {
  return updateProject(orgId, projectId, { status: 'PUBLISHED', publishedAt: new Date() });
}

async function attachMedia(orgId, projectId, input) {
  const kind = normalizeMediaKind(input.kind);
  const mediaId = input.mediaId || input.id;
  if (!mediaId || !input.url) {
    throw new AppError('mediaId and url required', 400, ErrorCodes.VALIDATION_ERROR);
  }
  const base = { mediaId: String(mediaId), url: String(input.url) };
  const item =
    kind === 'videos'
      ? { ...base, title: input.title || null }
      : kind === 'floorPlans'
        ? { ...base, config: input.config || null }
        : { ...base, tag: input.tag || null, order: input.order || null };

  const update = { $push: { [`media.${kind}`]: item }, $inc: { version: 1 } };
  const project = await ProjectModel.findOneAndUpdate({ _id: projectId, orgId }, update, {
    new: true,
  }).exec();
  if (!project) {
    throw new AppError('Project not found', 404, ErrorCodes.NOT_FOUND);
  }
  return item;
}

async function reorderMedia(orgId, projectId, input) {
  const kind = normalizeMediaKind(input.kind);
  const order = Array.isArray(input.order) ? input.order.map(String) : [];
  const project = await ProjectModel.findOne({ _id: projectId, orgId }).exec();
  if (!project) {
    throw new AppError('Project not found', 404, ErrorCodes.NOT_FOUND);
  }
  const items = (project.media && project.media[kind]) || [];
  if (!Array.isArray(items)) {
    throw new AppError('Invalid media kind', 400, ErrorCodes.VALIDATION_ERROR);
  }
  if (!order.length) {
    throw new AppError('order required', 400, ErrorCodes.VALIDATION_ERROR);
  }
  const byId = new Map(items.map((i) => [String(i.mediaId || ''), i]));
  const reordered = [];
  for (const id of order) {
    const item = byId.get(id);
    if (item) reordered.push(item);
  }
  for (const item of items) {
    const id = String(item.mediaId || '');
    if (id && !order.includes(id)) reordered.push(item);
  }
  if (kind === 'images') {
    reordered.forEach((i, idx) => {
      i.order = idx + 1;
    });
  }
  project.media[kind] = reordered;
  project.version += 1;
  await project.save();
  return reordered.map((i) => i.toObject());
}

async function detachMedia(orgId, projectId, input) {
  const kind = normalizeMediaKind(input.kind);
  const mediaId = input.mediaId || input.id;
  if (!mediaId) {
    throw new AppError('mediaId required', 400, ErrorCodes.VALIDATION_ERROR);
  }
  const project = await ProjectModel.findOneAndUpdate(
    { _id: projectId, orgId },
    { $pull: { [`media.${kind}`]: { mediaId: String(mediaId) } }, $inc: { version: 1 } },
    { new: true }
  ).exec();
  if (!project) {
    throw new AppError('Project not found', 404, ErrorCodes.NOT_FOUND);
  }
  return { success: true };
}

async function setBrochure(orgId, projectId, input) {
  const url = input.url;
  if (!url) {
    throw new AppError('url required', 400, ErrorCodes.VALIDATION_ERROR);
  }
  const project = await ProjectModel.findOneAndUpdate(
    { _id: projectId, orgId },
    { $set: { 'media.brochureUrl': String(url) }, $inc: { version: 1 } },
    { new: true }
  ).exec();
  if (!project) {
    throw new AppError('Project not found', 404, ErrorCodes.NOT_FOUND);
  }
  return project.toJSON();
}

async function addUnit(orgId, projectId, data) {
  const unitId = newUnitId();
  const unit = {
    unitId,
    title: data.title || null,
    configuration: data.configuration || null,
    bedrooms: data.bedrooms || null,
    bathrooms: data.bathrooms || null,
    carpetArea: data.carpetArea || null,
    builtUpArea: data.builtUpArea || null,
    price: data.price || null,
    floor: data.floor || null,
    tower: data.tower || null,
    status: data.status || 'AVAILABLE',
    metadata: data.metadata || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const project = await ProjectModel.findOneAndUpdate(
    { _id: projectId, orgId },
    { $push: { inventoryUnits: unit }, $inc: { version: 1 } },
    { new: true }
  ).exec();
  if (!project) {
    throw new AppError('Project not found', ErrorCodes.NOT_FOUND, 404);
  }
  return unit;
}

async function listUnits(orgId, projectId) {
  const project = await ProjectModel.findOne({ _id: projectId, orgId })
    .select({ inventoryUnits: 1 })
    .exec();
  if (!project) {
    throw new AppError('Project not found', 404, ErrorCodes.NOT_FOUND);
  }
  return (project.inventoryUnits || []).map((u) => ({ ...u.toObject(), _id: undefined }));
}

async function getUnit(orgId, projectId, unitId) {
  const project = await ProjectModel.findOne({ _id: projectId, orgId })
    .select({ inventoryUnits: 1 })
    .exec();
  if (!project) {
    throw new AppError('Project not found', 404, ErrorCodes.NOT_FOUND);
  }
  const unit = (project.inventoryUnits || []).find((u) => u.unitId === unitId);
  if (!unit) {
    throw new AppError('Unit not found', 404, ErrorCodes.NOT_FOUND);
  }
  return { ...unit.toObject(), _id: undefined };
}

async function updateUnit(orgId, projectId, unitId, data) {
  const project = await ProjectModel.findOne({ _id: projectId, orgId })
    .select({ inventoryUnits: 1 })
    .exec();
  if (!project) {
    throw new AppError('Project not found', 404, ErrorCodes.NOT_FOUND);
  }
  const unit = (project.inventoryUnits || []).find((u) => u.unitId === unitId);
  if (!unit) {
    throw new AppError('Unit not found', 404, ErrorCodes.NOT_FOUND);
  }
  Object.assign(unit, data, { updatedAt: new Date() });
  project.version += 1;
  await project.save();
  return { ...unit.toObject(), _id: undefined };
}

async function deleteUnit(orgId, projectId, unitId) {
  const project = await ProjectModel.findOneAndUpdate(
    { _id: projectId, orgId },
    { $pull: { inventoryUnits: { unitId } }, $inc: { version: 1 } },
    { new: true }
  ).exec();
  if (!project) {
    throw new AppError('Project not found', 404, ErrorCodes.NOT_FOUND);
  }
  return { success: true };
}

async function createInventoryImportJob(orgId, projectId, input) {
  const job = await prisma.bulkJob.create({
    data: {
      type: 'PROJECT_INVENTORY_IMPORT',
      status: 'PENDING',
      input: { orgId, projectId, ...input },
    },
  });
  return job;
}

async function getBulkJob(jobId) {
  const job = await prisma.bulkJob.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new AppError('Job not found', 404, ErrorCodes.NOT_FOUND);
  }
  return job;
}

module.exports = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  submitProject,
  publishProject,
  attachMedia,
  reorderMedia,
  detachMedia,
  setBrochure,
  addUnit,
  listUnits,
  getUnit,
  updateUnit,
  deleteUnit,
  createInventoryImportJob,
  getBulkJob,
};

