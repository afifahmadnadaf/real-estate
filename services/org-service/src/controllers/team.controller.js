'use strict';

const { httpStatus } = require('@real-estate/common');

const teamService = require('../services/team.service');

async function listTeams(req, res, next) {
  try {
    const { orgId } = req.params;
    const userId = req.headers['x-user-id'];
    const teams = await teamService.listTeams(orgId, userId);
    res.status(httpStatus.OK).json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
}

async function createTeam(req, res, next) {
  try {
    const { orgId } = req.params;
    const userId = req.headers['x-user-id'];
    const team = await teamService.createTeam(orgId, userId, req.body);
    res.status(httpStatus.CREATED).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
}

async function getTeam(req, res, next) {
  try {
    const { orgId, teamId } = req.params;
    const userId = req.headers['x-user-id'];
    const team = await teamService.getTeam(orgId, teamId, userId);
    res.status(httpStatus.OK).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
}

async function updateTeam(req, res, next) {
  try {
    const { orgId, teamId } = req.params;
    const userId = req.headers['x-user-id'];
    const team = await teamService.updateTeam(orgId, teamId, userId, req.body);
    res.status(httpStatus.OK).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
}

async function deleteTeam(req, res, next) {
  try {
    const { orgId, teamId } = req.params;
    const userId = req.headers['x-user-id'];
    const result = await teamService.deleteTeam(orgId, teamId, userId);
    res.status(httpStatus.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listTeams,
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
};
