'use strict';

const {
  AppError,
  errorCodes,
  generateSlug,
  paginate,
  parsePaginationParams,
} = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');
const { EVENT_TYPES } = require('@real-estate/events');

/**
 * Create organization
 */
async function createOrg(app, userId, data) {
  // Generate unique slug
  const baseSlug = generateSlug(data.name);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Create organization
  const org = await prisma.organization.create({
    data: {
      ...data,
      slug,
      createdById: userId,
      status: 'PENDING',
    },
  });

  // Add creator as owner member
  await prisma.orgMember.create({
    data: {
      orgId: org.id,
      userId,
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: new Date(),
    },
  });

  // Publish event
  const eventProducer = app.get('eventProducer');
  if (eventProducer) {
    await eventProducer.publish('user.events.v1', EVENT_TYPES.ORG?.CREATED || 'org.created', {
      orgId: org.id,
      name: org.name,
      type: org.type,
      createdById: userId,
      createdAt: org.createdAt.toISOString(),
    });
  }

  return org;
}

/**
 * List organizations
 */
async function listOrgs(userId, userRole, query) {
  const { limit, skip } = parsePaginationParams(query);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);

  let where = {};

  if (!isAdmin) {
    // Regular users only see their orgs
    where = {
      members: {
        some: {
          userId,
          status: { not: 'REMOVED' },
        },
      },
    };
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.type) {
    where.type = query.type;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { slug: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      skip,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { members: true },
        },
      },
    }),
    prisma.organization.count({ where }),
  ]);

  return paginate({
    items: orgs,
    limit,
    total,
  });
}

/**
 * Get organization
 */
async function getOrg(orgId, _userId) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      members: {
        where: { status: { not: 'REMOVED' } },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      },
      kycDocuments: true,
      _count: {
        select: { members: true },
      },
    },
  });

  if (!org) {
    throw new AppError('Organization not found', 404, errorCodes.RESOURCE.ORG_NOT_FOUND);
  }

  return org;
}

/**
 * Update organization
 */
async function updateOrg(app, orgId, userId, data) {
  // Check membership and permission
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

  const org = await prisma.organization.update({
    where: { id: orgId },
    data,
  });

  // Publish event
  const eventProducer = app.get('eventProducer');
  if (eventProducer) {
    await eventProducer.publish('user.events.v1', EVENT_TYPES.ORG?.UPDATED || 'org.updated', {
      orgId: org.id,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    });
  }

  return org;
}

/**
 * Approve organization (admin)
 */
async function approveOrg(app, orgId, adminId) {
  const org = await prisma.organization.update({
    where: { id: orgId },
    data: { status: 'VERIFIED' },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      actorType: 'ADMIN',
      action: 'APPROVE_ORG',
      resourceType: 'ORGANIZATION',
      resourceId: orgId,
    },
  });

  // Publish event
  const eventProducer = app.get('eventProducer');
  if (eventProducer) {
    await eventProducer.publish('user.events.v1', EVENT_TYPES.ORG?.VERIFIED || 'org.verified', {
      orgId: org.id,
      approvedBy: adminId,
      approvedAt: new Date().toISOString(),
    });
  }

  return org;
}

/**
 * Reject organization (admin)
 */
async function rejectOrg(app, orgId, adminId, reason) {
  const org = await prisma.organization.update({
    where: { id: orgId },
    data: {
      status: 'REJECTED',
      metadata: { rejectionReason: reason },
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      actorType: 'ADMIN',
      action: 'REJECT_ORG',
      resourceType: 'ORGANIZATION',
      resourceId: orgId,
      changes: { reason },
    },
  });

  // Publish event
  const eventProducer = app.get('eventProducer');
  if (eventProducer) {
    await eventProducer.publish('user.events.v1', EVENT_TYPES.ORG?.REJECTED || 'org.rejected', {
      orgId: org.id,
      rejectedBy: adminId,
      reason,
      rejectedAt: new Date().toISOString(),
    });
  }

  return org;
}

/**
 * Request changes (admin)
 */
async function requestChanges(app, orgId, adminId, changes) {
  const org = await prisma.organization.update({
    where: { id: orgId },
    data: {
      status: 'PENDING',
      metadata: { requestedChanges: changes },
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      actorType: 'ADMIN',
      action: 'REQUEST_CHANGES_ORG',
      resourceType: 'ORGANIZATION',
      resourceId: orgId,
      changes: { requestedChanges: changes },
    },
  });

  return org;
}

/**
 * Upload organization logo
 */
async function uploadLogo(orgId, userId, mediaId) {
  // Check if user has permission
  const member = await prisma.orgMember.findFirst({
    where: {
      orgId,
      userId,
      role: { in: ['OWNER', 'ADMIN'] },
      status: 'ACTIVE',
    },
  });

  if (!member) {
    throw new AppError('Forbidden', 403, errorCodes.FORBIDDEN);
  }

  // Get media to verify it exists and belongs to user
  // In production, would call media service
  // For now, just update the org with logo URL
  const org = await prisma.organization.update({
    where: { id: orgId },
    data: {
      logoUrl: `/media/${mediaId}`, // In production, get actual URL from media service
    },
  });

  return org;
}

module.exports = {
  createOrg,
  listOrgs,
  getOrg,
  updateOrg,
  uploadLogo,
  approveOrg,
  rejectOrg,
  requestChanges,
};
