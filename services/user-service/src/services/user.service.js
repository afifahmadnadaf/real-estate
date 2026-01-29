'use strict';

const { AppError, errorCodes, paginate, parsePaginationParams } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');
const { EVENT_TYPES } = require('@real-estate/events');

const userRepository = require('../repositories/user.repository');

const sessionService = require('./session.service');

/**
 * Get user by ID
 */
async function getUserById(userId) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404, errorCodes.RESOURCE.USER_NOT_FOUND);
  }

  return sanitizeUser(user);
}

/**
 * Update user profile
 */
async function updateUser(app, userId, data) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404, errorCodes.RESOURCE.USER_NOT_FOUND);
  }

  const updated = await userRepository.update(userId, data);

  // Publish event
  const eventProducer = app.get('eventProducer');
  if (eventProducer) {
    await eventProducer.publishUserEvent(EVENT_TYPES.USER.PROFILE_UPDATED, {
      userId,
      changes: Object.keys(data).map((field) => ({
        field,
        newValue: data[field],
      })),
      updatedAt: new Date().toISOString(),
    });
  }

  return sanitizeUser(updated);
}

/**
 * Get user preferences
 */
async function getUserPreferences(userId) {
  let preferences = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  if (!preferences) {
    // Create default preferences
    preferences = await prisma.userPreferences.create({
      data: {
        userId,
        notificationSettings: {
          email: true,
          sms: true,
          push: true,
          whatsapp: false,
        },
        searchPreferences: {},
        displayPreferences: {
          currency: 'INR',
          areaUnit: 'SQFT',
          language: 'en',
        },
      },
    });
  }

  return preferences;
}

/**
 * Update user preferences
 */
async function updateUserPreferences(userId, data) {
  const preferences = await prisma.userPreferences.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data,
    },
  });

  return preferences;
}

async function getUserConsents(userId) {
  const consents = await prisma.userConsent.findMany({
    where: { userId },
    orderBy: { consentType: 'asc' },
  });
  return consents;
}

async function updateUserConsents(userId, consents = {}) {
  const types = Object.keys(consents || {});
  const updates = [];

  for (const consentType of types) {
    const granted = Boolean(consents[consentType]);
    updates.push(
      prisma.userConsent.upsert({
        where: { userId_consentType: { userId, consentType } },
        update: {
          granted,
          grantedAt: granted ? new Date() : undefined,
          revokedAt: granted ? undefined : new Date(),
        },
        create: {
          userId,
          consentType,
          granted,
          grantedAt: granted ? new Date() : null,
          revokedAt: granted ? null : new Date(),
        },
      })
    );
  }

  await prisma.$transaction(updates);
  return getUserConsents(userId);
}

async function getSecuritySettings(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      emailVerified: true,
      phoneVerified: true,
      status: true,
      metadata: true,
    },
  });
  if (!user) {
    throw new AppError('User not found', 404, errorCodes.RESOURCE.USER_NOT_FOUND);
  }
  const mfa = user.metadata?.mfa || {};
  return {
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    mfaEnabled: Boolean(mfa.enabled),
    mfaMethod: mfa.method || null,
    status: user.status,
  };
}

async function updateSecuritySettings(userId, data = {}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404, errorCodes.RESOURCE.USER_NOT_FOUND);
  }
  const metadata = user.metadata || {};
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      metadata: {
        ...metadata,
        security: {
          ...(metadata.security || {}),
          ...data,
        },
      },
    },
  });
  return sanitizeUser(updated);
}

async function getUserActivity(userId, options = {}) {
  const { limit = 20 } = options;
  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { lastUsedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      deviceInfo: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
    },
  });
  return { sessions };
}

async function deactivateUser(app, userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, errorCodes.RESOURCE.USER_NOT_FOUND);
  }
  await userRepository.update(userId, {
    status: 'INACTIVE',
    metadata: { ...(user.metadata || {}), deactivatedAt: new Date().toISOString() },
  });
  await sessionService.revokeAllUserSessions(userId, 'USER');

  const eventProducer = app.get('eventProducer');
  if (eventProducer) {
    await eventProducer.publishUserEvent(EVENT_TYPES.USER.DEACTIVATED || 'user.deactivated', {
      userId,
      deactivatedAt: new Date().toISOString(),
    });
  }
  return true;
}

async function exportUserData(userId) {
  const [user, preferences, consents] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.userPreferences.findUnique({ where: { userId } }),
    prisma.userConsent.findMany({ where: { userId } }),
  ]);
  if (!user) {
    throw new AppError('User not found', 404, errorCodes.RESOURCE.USER_NOT_FOUND);
  }
  return {
    user: sanitizeUser(user),
    preferences,
    consents,
  };
}

async function verifyEmail(userId) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  });
  return sanitizeUser(updated);
}

async function verifyPhone(userId) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { phoneVerified: true },
  });
  return sanitizeUser(updated);
}

/**
 * Request account deletion
 */
async function requestAccountDeletion(app, userId) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404, errorCodes.RESOURCE.USER_NOT_FOUND);
  }

  // Mark user for deletion
  await userRepository.update(userId, {
    status: 'DELETED',
    metadata: {
      ...user.metadata,
      deletionRequestedAt: new Date().toISOString(),
    },
  });

  // Revoke all sessions
  await sessionService.revokeAllUserSessions(userId, 'USER');

  // Publish event
  const eventProducer = app.get('eventProducer');
  if (eventProducer) {
    await eventProducer.publishUserEvent(EVENT_TYPES.USER.DELETED, {
      userId,
      deletionType: 'SOFT',
      requestedBy: 'USER',
      deletedAt: new Date().toISOString(),
    });
  }

  return true;
}

/**
 * Search users (admin)
 */
async function searchUsers(query) {
  const { limit, skip } = parsePaginationParams(query);

  const where = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search } },
    ];
  }

  if (query.role) {
    where.role = query.role;
  }

  if (query.status) {
    where.status = query.status;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return paginate({
    items: users,
    limit,
    total,
  });
}

/**
 * Admin update user
 */
async function adminUpdateUser(app, userId, data, adminId) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404, errorCodes.RESOURCE.USER_NOT_FOUND);
  }

  const updated = await userRepository.update(userId, data);

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      actorType: 'ADMIN',
      action: 'UPDATE_USER',
      resourceType: 'USER',
      resourceId: userId,
      changes: data,
    },
  });

  return sanitizeUser(updated);
}

/**
 * Block user
 */
async function blockUser(app, userId, adminId, reason) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404, errorCodes.RESOURCE.USER_NOT_FOUND);
  }

  await userRepository.update(userId, { status: 'BLOCKED' });

  // Revoke all sessions
  await sessionService.revokeAllUserSessions(userId, 'ADMIN');

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      actorType: 'ADMIN',
      action: 'BLOCK_USER',
      resourceType: 'USER',
      resourceId: userId,
      changes: { reason },
    },
  });

  // Publish event
  const eventProducer = app.get('eventProducer');
  if (eventProducer) {
    await eventProducer.publishUserEvent(EVENT_TYPES.USER.BLOCKED, {
      userId,
      reason,
      blockedBy: adminId,
      blockedAt: new Date().toISOString(),
    });
  }
}

/**
 * Unblock user
 */
async function unblockUser(app, userId, adminId) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404, errorCodes.RESOURCE.USER_NOT_FOUND);
  }

  await userRepository.update(userId, { status: 'ACTIVE' });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      actorType: 'ADMIN',
      action: 'UNBLOCK_USER',
      resourceType: 'USER',
      resourceId: userId,
    },
  });

  // Publish event
  const eventProducer = app.get('eventProducer');
  if (eventProducer) {
    await eventProducer.publishUserEvent(EVENT_TYPES.USER.UNBLOCKED, {
      userId,
      unblockedBy: adminId,
      unblockedAt: new Date().toISOString(),
    });
  }
}

/**
 * Remove sensitive fields from user
 */
function sanitizeUser(user) {
  const { passwordHash: _passwordHash, ...sanitized } = user;
  return sanitized;
}

module.exports = {
  getUserById,
  updateUser,
  getUserPreferences,
  updateUserPreferences,
  getUserConsents,
  updateUserConsents,
  getSecuritySettings,
  updateSecuritySettings,
  getUserActivity,
  deactivateUser,
  exportUserData,
  verifyEmail,
  verifyPhone,
  requestAccountDeletion,
  searchUsers,
  adminUpdateUser,
  blockUser,
  unblockUser,
};
