'use strict';

const crypto = require('crypto');

const { AppError, errorCodes, addDays } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');
const { EVENT_TYPES } = require('@real-estate/events');

const config = require('../config');

/**
 * List members
 */
async function listMembers(orgId, userId) {
  // Check access
  const member = await prisma.orgMember.findFirst({
    where: {
      orgId,
      userId,
      status: { not: 'REMOVED' },
    },
  });

  if (!member) {
    throw new AppError('Access denied', 403, errorCodes.AUTHORIZATION.ORG_ACCESS_DENIED);
  }

  const members = await prisma.orgMember.findMany({
    where: {
      orgId,
      status: { not: 'REMOVED' },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  return members;
}

/**
 * Invite member
 */
async function inviteMember(app, orgId, userId, data) {
  // Check permission
  const member = await prisma.orgMember.findFirst({
    where: {
      orgId,
      userId,
      status: 'ACTIVE',
      role: { in: ['OWNER', 'ADMIN'] },
    },
  });

  if (!member) {
    throw new AppError('Access denied', 403, errorCodes.AUTHORIZATION.ORG_ACCESS_DENIED);
  }

  // Check if already a member
  const existingMember = await prisma.orgMember.findFirst({
    where: {
      orgId,
      user: { email: data.email },
      status: { not: 'REMOVED' },
    },
  });

  if (existingMember) {
    throw new AppError('User is already a member', 409, errorCodes.RESOURCE.ALREADY_EXISTS);
  }

  // Check for existing invite
  const existingInvite = await prisma.orgInvite.findFirst({
    where: {
      orgId,
      email: data.email,
      expiresAt: { gt: new Date() },
      acceptedAt: null,
    },
  });

  if (existingInvite) {
    throw new AppError('Invite already sent', 409, errorCodes.RESOURCE.ALREADY_EXISTS);
  }

  // Create invite
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = addDays(new Date(), config.invite.expiryDays);

  const invite = await prisma.orgInvite.create({
    data: {
      orgId,
      email: data.email,
      role: data.role || 'MEMBER',
      token,
      expiresAt,
      invitedById: userId,
    },
  });

  // TODO: Send invite email

  // Publish event
  const eventProducer = app.get('eventProducer');
  if (eventProducer) {
    await eventProducer.publish(
      'user.events.v1',
      EVENT_TYPES.ORG?.MEMBER_INVITED || 'org.member.invited',
      {
        orgId,
        email: data.email,
        role: data.role,
        invitedBy: userId,
        invitedAt: new Date().toISOString(),
      }
    );
  }

  return invite;
}

/**
 * Get member
 */
async function getMember(orgId, memberId, _userId) {
  const member = await prisma.orgMember.findFirst({
    where: {
      id: memberId,
      orgId,
      status: { not: 'REMOVED' },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!member) {
    throw new AppError('Member not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }

  return member;
}

/**
 * Update member
 */
async function updateMember(app, orgId, memberId, userId, data) {
  // Check permission
  const currentMember = await prisma.orgMember.findFirst({
    where: {
      orgId,
      userId,
      status: 'ACTIVE',
      role: { in: ['OWNER', 'ADMIN'] },
    },
  });

  if (!currentMember) {
    throw new AppError('Access denied', 403, errorCodes.AUTHORIZATION.ORG_ACCESS_DENIED);
  }

  // Get target member
  const targetMember = await prisma.orgMember.findFirst({
    where: { id: memberId, orgId },
  });

  if (!targetMember) {
    throw new AppError('Member not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }

  // Cannot change owner role
  if (targetMember.role === 'OWNER' && data.role) {
    throw new AppError('Cannot change owner role', 403, errorCodes.AUTHORIZATION.FORBIDDEN);
  }

  const updated = await prisma.orgMember.update({
    where: { id: memberId },
    data,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Publish event
  const eventProducer = app.get('eventProducer');
  if (eventProducer && data.role) {
    await eventProducer.publish(
      'user.events.v1',
      EVENT_TYPES.ORG?.MEMBER_ROLE_CHANGED || 'org.member.role.changed',
      {
        orgId,
        memberId,
        userId: targetMember.userId,
        newRole: data.role,
        changedBy: userId,
        changedAt: new Date().toISOString(),
      }
    );
  }

  return updated;
}

/**
 * Remove member
 */
async function removeMember(app, orgId, memberId, userId) {
  // Check permission
  const currentMember = await prisma.orgMember.findFirst({
    where: {
      orgId,
      userId,
      status: 'ACTIVE',
      role: { in: ['OWNER', 'ADMIN'] },
    },
  });

  if (!currentMember) {
    throw new AppError('Access denied', 403, errorCodes.AUTHORIZATION.ORG_ACCESS_DENIED);
  }

  // Get target member
  const targetMember = await prisma.orgMember.findFirst({
    where: { id: memberId, orgId },
  });

  if (!targetMember) {
    throw new AppError('Member not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }

  // Cannot remove owner
  if (targetMember.role === 'OWNER') {
    throw new AppError('Cannot remove owner', 403, errorCodes.AUTHORIZATION.FORBIDDEN);
  }

  await prisma.orgMember.update({
    where: { id: memberId },
    data: { status: 'REMOVED' },
  });

  // Publish event
  const eventProducer = app.get('eventProducer');
  if (eventProducer) {
    await eventProducer.publish(
      'user.events.v1',
      EVENT_TYPES.ORG?.MEMBER_REMOVED || 'org.member.removed',
      {
        orgId,
        memberId,
        userId: targetMember.userId,
        removedBy: userId,
        removedAt: new Date().toISOString(),
      }
    );
  }
}

async function resendInvite(app, orgId, memberId, userId) {
  const member = await prisma.orgMember.findFirst({
    where: {
      orgId,
      userId,
      status: 'ACTIVE',
      role: { in: ['OWNER', 'ADMIN'] },
    },
  });

  if (!member) {
    throw new AppError('Access denied', 403, errorCodes.AUTHORIZATION.ORG_ACCESS_DENIED);
  }

  const inviteById = await prisma.orgInvite.findUnique({
    where: { id: memberId },
  });

  if (inviteById && inviteById.orgId === orgId && inviteById.acceptedAt === null) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = addDays(new Date(), config.invite.expiryDays);
    const updated = await prisma.orgInvite.update({
      where: { id: inviteById.id },
      data: { token, expiresAt, invitedById: userId },
    });
    const eventProducer = app.get('eventProducer');
    if (eventProducer) {
      await eventProducer.publish(
        'user.events.v1',
        EVENT_TYPES.ORG?.MEMBER_INVITE_RESENT || 'org.member.invite.resent',
        {
          orgId,
          email: updated.email,
          role: updated.role,
          resentBy: userId,
          resentAt: new Date().toISOString(),
        }
      );
    }
    return updated;
  }

  throw new AppError('Invite not found', 404, errorCodes.RESOURCE.NOT_FOUND);
}

module.exports = {
  listMembers,
  inviteMember,
  resendInvite,
  getMember,
  updateMember,
  removeMember,
};
