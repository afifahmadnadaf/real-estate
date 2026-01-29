'use strict';

const {
  AppError,
  errorCodes,
  hashToken,
  generateSecureToken,
  addDays,
} = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');
const jwt = require('jsonwebtoken');

const config = require('../config');

const authService = require('./auth.service');

/**
 * Create a new session
 */
async function createSession(user, options = {}) {
  const { deviceInfo, ipAddress, userAgent } = options;

  // Check max sessions
  const sessionCount = await prisma.session.count({
    where: { userId: user.id },
  });

  if (sessionCount >= config.session.maxPerUser) {
    // Remove oldest session
    const oldestSession = await prisma.session.findFirst({
      where: { userId: user.id },
      orderBy: { lastUsedAt: 'asc' },
    });

    if (oldestSession) {
      await prisma.session.delete({
        where: { id: oldestSession.id },
      });
    }
  }

  // Generate tokens
  const sessionId = generateSecureToken(16);
  const refreshToken = generateSecureToken(32);
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = addDays(new Date(), config.session.inactivityTimeoutDays);

  // Create session
  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      refreshTokenHash,
      deviceInfo: deviceInfo || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt,
    },
  });

  // Generate access token
  const accessToken = authService.generateAccessToken(user, sessionId);

  return {
    sessionId,
    accessToken,
    refreshToken,
    expiresAt,
  };
}

/**
 * Refresh session and issue new tokens
 */
async function refreshSession(app, refreshToken) {
  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
  } catch (error) {
    throw new AppError('Invalid refresh token', 401, errorCodes.AUTH.REFRESH_TOKEN_INVALID);
  }

  if (decoded.type !== 'refresh') {
    throw new AppError('Invalid token type', 401, errorCodes.AUTH.TOKEN_INVALID);
  }

  // Find session
  const refreshTokenHash = hashToken(refreshToken);
  const session = await prisma.session.findFirst({
    where: {
      id: decoded.sessionId,
      refreshTokenHash,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!session) {
    throw new AppError('Session not found or expired', 401, errorCodes.AUTH.SESSION_EXPIRED);
  }

  if (session.user.status === 'BLOCKED') {
    throw new AppError('Account is blocked', 403, errorCodes.AUTH.ACCOUNT_BLOCKED);
  }

  // Generate new refresh token (rotation)
  const newRefreshToken = generateSecureToken(32);
  const newRefreshTokenHash = hashToken(newRefreshToken);
  const newExpiresAt = addDays(new Date(), config.session.inactivityTimeoutDays);

  // Update session
  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: newRefreshTokenHash,
      expiresAt: newExpiresAt,
      lastUsedAt: new Date(),
    },
  });

  // Generate new access token
  const accessToken = authService.generateAccessToken(session.user, session.id);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    expiresAt: newExpiresAt,
  };
}

/**
 * List user sessions
 */
async function listUserSessions(userId) {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      deviceInfo: true,
      ipAddress: true,
      createdAt: true,
      lastUsedAt: true,
    },
    orderBy: { lastUsedAt: 'desc' },
  });

  return sessions;
}

/**
 * Revoke a session
 */
async function revokeSession(sessionId, userId, _reason = 'USER') {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    throw new AppError('Session not found', 404, errorCodes.RESOURCE.SESSION_NOT_FOUND);
  }

  await prisma.session.delete({
    where: { id: sessionId },
  });

  return true;
}

/**
 * Revoke all user sessions
 */
async function revokeAllUserSessions(userId, _reason = 'SECURITY') {
  await prisma.session.deleteMany({
    where: { userId },
  });

  return true;
}

module.exports = {
  createSession,
  refreshSession,
  listUserSessions,
  revokeSession,
  revokeAllUserSessions,
};
