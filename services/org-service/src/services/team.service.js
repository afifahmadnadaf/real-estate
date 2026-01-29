'use strict';

const { AppError, errorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

async function requireOrgAccess(orgId, userId) {
  const membership = await prisma.orgMember.findFirst({
    where: { orgId, userId, status: 'ACTIVE' },
  });
  if (!membership) {
    throw new AppError('Access denied', 403, errorCodes.AUTHORIZATION.ORG_ACCESS_DENIED);
  }
  return membership;
}

async function listTeams(orgId, userId) {
  await requireOrgAccess(orgId, userId);
  return prisma.team.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
  });
}

async function createTeam(orgId, userId, data) {
  const membership = await requireOrgAccess(orgId, userId);
  if (!['OWNER', 'ADMIN'].includes(membership.role)) {
    throw new AppError('Forbidden', 403, errorCodes.AUTHORIZATION.FORBIDDEN);
  }
  return prisma.team.create({
    data: {
      orgId,
      name: data.name,
      metadata: data.metadata || null,
    },
  });
}

async function getTeam(orgId, teamId, userId) {
  await requireOrgAccess(orgId, userId);
  const team = await prisma.team.findFirst({
    where: { id: teamId, orgId },
  });
  if (!team) {
    throw new AppError('Team not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }
  return team;
}

async function updateTeam(orgId, teamId, userId, data) {
  const membership = await requireOrgAccess(orgId, userId);
  if (!['OWNER', 'ADMIN'].includes(membership.role)) {
    throw new AppError('Forbidden', 403, errorCodes.AUTHORIZATION.FORBIDDEN);
  }
  return prisma.team.update({
    where: { id: teamId },
    data: { name: data.name, metadata: data.metadata },
  });
}

async function deleteTeam(orgId, teamId, userId) {
  const membership = await requireOrgAccess(orgId, userId);
  if (!['OWNER', 'ADMIN'].includes(membership.role)) {
    throw new AppError('Forbidden', 403, errorCodes.AUTHORIZATION.FORBIDDEN);
  }
  const team = await prisma.team.findFirst({ where: { id: teamId, orgId } });
  if (!team) {
    throw new AppError('Team not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }
  await prisma.team.delete({ where: { id: teamId } });
  return { success: true };
}

module.exports = {
  listTeams,
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
};
