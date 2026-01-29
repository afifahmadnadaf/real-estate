'use strict';

const { httpStatus } = require('@real-estate/common');

const projectService = require('../services/project.service');

async function createProject(req, res, next) {
  try {
    const orgId = req.user.orgId;
    const project = await projectService.createProject(orgId, req.body);
    res.status(httpStatus.CREATED).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
}

async function listProjects(req, res, next) {
  try {
    const orgId = req.user.orgId;
    const projects = await projectService.listProjects(orgId, {
      status: req.query.status,
      limit: parseInt(req.query.limit, 10) || 50,
      offset: parseInt(req.query.offset, 10) || 0,
    });
    res.status(httpStatus.OK).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
}

async function getProject(req, res, next) {
  try {
    const orgId = req.user.orgId;
    const project = await projectService.getProject(orgId, req.params.projectId);
    res.status(httpStatus.OK).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
}

async function updateProject(req, res, next) {
  try {
    const orgId = req.user.orgId;
    const project = await projectService.updateProject(orgId, req.params.projectId, req.body);
    res.status(httpStatus.OK).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
}

async function deleteProject(req, res, next) {
  try {
    const orgId = req.user.orgId;
    const project = await projectService.deleteProject(orgId, req.params.projectId);
    res.status(httpStatus.OK).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
}

async function submitProject(req, res, next) {
  try {
    const orgId = req.user.orgId;
    const project = await projectService.submitProject(orgId, req.params.projectId);
    res.status(httpStatus.OK).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
}

async function publishProject(req, res, next) {
  try {
    const orgId = req.user.orgId;
    const project = await projectService.publishProject(orgId, req.params.projectId);
    res.status(httpStatus.OK).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
}

async function attachMedia(req, res, next) {
  try {
    const orgId = req.user.orgId;
    const item = await projectService.attachMedia(orgId, req.params.projectId, req.body || {});
    res.status(httpStatus.CREATED).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

async function reorderMedia(req, res, next) {
  try {
    const orgId = req.user.orgId;
    const media = await projectService.reorderMedia(orgId, req.params.projectId, req.body || {});
    res.status(httpStatus.OK).json({ success: true, data: media });
  } catch (error) {
    next(error);
  }
}

async function detachMedia(req, res, next) {
  try {
    const orgId = req.user.orgId;
    const result = await projectService.detachMedia(orgId, req.params.projectId, {
      kind: req.query.kind,
      mediaId: req.params.mediaId,
    });
    res.status(httpStatus.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function uploadBrochure(req, res, next) {
  try {
    const orgId = req.user.orgId;
    const project = await projectService.setBrochure(orgId, req.params.projectId, req.body || {});
    res.status(httpStatus.OK).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
}

async function addUnit(req, res, next) {
  try {
    const orgId = req.user.orgId;
    const unit = await projectService.addUnit(orgId, req.params.projectId, req.body);
    res.status(httpStatus.CREATED).json({ success: true, data: unit });
  } catch (error) {
    next(error);
  }
}

async function listUnits(req, res, next) {
  try {
    const orgId = req.user.orgId;
    const units = await projectService.listUnits(orgId, req.params.projectId);
    res.status(httpStatus.OK).json({ success: true, data: units });
  } catch (error) {
    next(error);
  }
}

async function getUnit(req, res, next) {
  try {
    const orgId = req.user.orgId;
    const unit = await projectService.getUnit(orgId, req.params.projectId, req.params.unitId);
    res.status(httpStatus.OK).json({ success: true, data: unit });
  } catch (error) {
    next(error);
  }
}

async function updateUnit(req, res, next) {
  try {
    const orgId = req.user.orgId;
    const unit = await projectService.updateUnit(
      orgId,
      req.params.projectId,
      req.params.unitId,
      req.body
    );
    res.status(httpStatus.OK).json({ success: true, data: unit });
  } catch (error) {
    next(error);
  }
}

async function deleteUnit(req, res, next) {
  try {
    const orgId = req.user.orgId;
    const result = await projectService.deleteUnit(orgId, req.params.projectId, req.params.unitId);
    res.status(httpStatus.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function startInventoryImport(req, res, next) {
  try {
    const orgId = req.user.orgId;
    const job = await projectService.createInventoryImportJob(
      orgId,
      req.params.projectId,
      req.body || {}
    );
    res.status(httpStatus.CREATED).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
}

async function getInventoryImportJob(req, res, next) {
  try {
    const job = await projectService.getBulkJob(req.params.jobId);
    res.status(httpStatus.OK).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
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
  uploadBrochure,
  addUnit,
  listUnits,
  getUnit,
  updateUnit,
  deleteUnit,
  startInventoryImport,
  getInventoryImportJob,
};

