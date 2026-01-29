'use strict';

const { AppError, errorCodes, hashPassword, comparePassword } = require('@real-estate/common');
const { prisma: _prisma } = require('@real-estate/db-models');
const { EVENT_TYPES } = require('@real-estate/events');
const jwt = require('jsonwebtoken');

const config = require('../config');
const userRepository = require('../repositories/user.repository');

const otpService = require('./otp.service');
const sessionService = require('./session.service');

/**
 * Verify OTP and login/register user
 */
async function verifyOtpAndLogin(app, params) {
  const { identifier, identifierType, otp, purpose, deviceInfo, ipAddress, userAgent } = params;

  // Verify OTP
  await otpService.verifyOtp(app, identifier, identifierType, otp, purpose);

  // Find or create user
  let user = await userRepository.findByIdentifier(identifier, identifierType);
  let isNewUser = false;

  if (!user) {
    // Create new user
    user = await userRepository.create({
      [identifierType.toLowerCase()]: identifier,
      [`${identifierType.toLowerCase()}Verified`]: true,
      status: 'ACTIVE',
    });
    isNewUser = true;

    // Publish user registered event
    const eventProducer = app.get('eventProducer');
    if (eventProducer) {
      await eventProducer.publishUserEvent(EVENT_TYPES.USER.REGISTERED, {
        userId: user.id,
        [identifierType.toLowerCase()]: identifier,
        registrationMethod: 'OTP',
        registeredAt: new Date().toISOString(),
      });
    }
  } else {
    // Update verified status
    if (identifierType === 'PHONE' && !user.phoneVerified) {
      user = await userRepository.update(user.id, { phoneVerified: true });
    } else if (identifierType === 'EMAIL' && !user.emailVerified) {
      user = await userRepository.update(user.id, { emailVerified: true });
    }
  }

  // Check if blocked
  if (user.status === 'BLOCKED') {
    throw new AppError('Account is blocked', 403, errorCodes.AUTH.ACCOUNT_BLOCKED);
  }

  // Create session and tokens
  const session = await sessionService.createSession(user, {
    deviceInfo,
    ipAddress,
    userAgent,
  });

  return {
    user: sanitizeUser(user),
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    isNewUser,
  };
}

/**
 * Login with password
 */
async function passwordLogin(app, params) {
  const { identifier, password, deviceInfo, ipAddress, userAgent } = params;

  // Find user by email or phone
  let user = await userRepository.findByEmail(identifier);
  if (!user) {
    user = await userRepository.findByPhone(identifier);
  }

  if (!user) {
    throw new AppError('Invalid credentials', 401, errorCodes.AUTH.INVALID_CREDENTIALS);
  }

  if (!user.passwordHash) {
    throw new AppError('Password not set', 401, errorCodes.AUTH.INVALID_CREDENTIALS);
  }

  // Verify password
  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Invalid credentials', 401, errorCodes.AUTH.INVALID_CREDENTIALS);
  }

  // Check if blocked
  if (user.status === 'BLOCKED') {
    throw new AppError('Account is blocked', 403, errorCodes.AUTH.ACCOUNT_BLOCKED);
  }

  // Create session
  const session = await sessionService.createSession(user, {
    deviceInfo,
    ipAddress,
    userAgent,
  });

  return {
    user: sanitizeUser(user),
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  };
}

/**
 * Reset password
 */
async function resetPassword(app, params) {
  const { identifier, identifierType, otp, newPassword } = params;

  // Verify OTP
  await otpService.verifyOtp(app, identifier, identifierType, otp, 'RESET_PASSWORD');

  // Find user
  const user = await userRepository.findByIdentifier(identifier, identifierType);
  if (!user) {
    throw new AppError('User not found', 404, errorCodes.RESOURCE.USER_NOT_FOUND);
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password
  await userRepository.update(user.id, { passwordHash });

  // Revoke all sessions for security
  await sessionService.revokeAllUserSessions(user.id, 'SECURITY');

  // Publish event
  const eventProducer = app.get('eventProducer');
  if (eventProducer) {
    await eventProducer.publishUserEvent(EVENT_TYPES.USER.PASSWORD_CHANGED, {
      userId: user.id,
      changeType: 'RESET',
      changedAt: new Date().toISOString(),
    });
  }
}

/**
 * Generate access token
 */
function generateAccessToken(user, sessionId) {
  return jwt.sign(
    {
      sub: user.id,
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      sessionId,
      type: 'access',
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.accessExpiry,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }
  );
}

/**
 * Generate refresh token
 */
function generateRefreshToken(user, sessionId) {
  return jwt.sign(
    {
      sub: user.id,
      sessionId,
      type: 'refresh',
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.refreshExpiry,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }
  );
}

/**
 * Remove sensitive fields from user
 */
function sanitizeUser(user) {
  const { passwordHash: _passwordHash, ...sanitized } = user;
  return sanitized;
}

module.exports = {
  verifyOtpAndLogin,
  passwordLogin,
  resetPassword,
  generateAccessToken,
  generateRefreshToken,
  sanitizeUser,
};
