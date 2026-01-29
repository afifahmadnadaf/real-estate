'use strict';

const { AppError, errorCodes, httpStatus } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');
const speakeasy = require('speakeasy');

const authService = require('../services/auth.service');
const otpService = require('../services/otp.service');
const sessionService = require('../services/session.service');

/**
 * Request OTP for login/registration
 */
async function requestOtp(req, res, next) {
  try {
    const { identifier, identifierType, purpose } = req.body;

    await otpService.sendOtp(req.app, identifier, identifierType, purpose);

    res.status(httpStatus.OK).json({
      success: true,
      message: `OTP sent to ${identifierType.toLowerCase()}`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify OTP and issue tokens
 */
async function verifyOtp(req, res, next) {
  try {
    const { identifier, identifierType, otp, purpose, deviceInfo } = req.body;

    const result = await authService.verifyOtpAndLogin(req.app, {
      identifier,
      identifierType,
      otp,
      purpose,
      deviceInfo,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Password login
 */
async function passwordLogin(req, res, next) {
  try {
    const { identifier, password, deviceInfo } = req.body;

    const result = await authService.passwordLogin(req.app, {
      identifier,
      password,
      deviceInfo,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Request password reset
 */
async function requestPasswordReset(req, res, next) {
  try {
    const { identifier, identifierType } = req.body;

    await otpService.sendOtp(req.app, identifier, identifierType, 'RESET_PASSWORD');

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Password reset OTP sent',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Confirm password reset
 */
async function confirmPasswordReset(req, res, next) {
  try {
    const { identifier, identifierType, otp, newPassword } = req.body;

    await authService.resetPassword(req.app, {
      identifier,
      identifierType,
      otp,
      newPassword,
    });

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh access token
 */
async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;

    const result = await sessionService.refreshSession(req.app, refreshToken);

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logout current session
 */
async function logout(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    const sessionId = req.headers['x-session-id'];

    if (sessionId) {
      await sessionService.revokeSession(sessionId, userId, 'LOGOUT');
    }

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List active sessions
 */
async function listSessions(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }

    const sessions = await sessionService.listUserSessions(userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Revoke a specific session
 */
async function revokeSession(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    const { sessionId } = req.params;

    await sessionService.revokeSession(sessionId, userId, 'USER');

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Session revoked',
    });
  } catch (error) {
    next(error);
  }
}

async function getPublicKeys(req, res) {
  const jwks = process.env.JWT_JWKS;
  if (jwks) {
    try {
      const parsed = JSON.parse(jwks);
      return res.status(httpStatus.OK).json(parsed);
    } catch (error) {
      return res.status(httpStatus.OK).json({ keys: [] });
    }
  }
  return res.status(httpStatus.OK).json({ keys: [] });
}

async function enableMfa(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }

    const secret = speakeasy.generateSecret({
      length: 20,
      name: `real-estate:${userId}`,
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const metadata = user?.metadata || {};
    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...metadata,
          mfa: { enabled: false, method: 'totp', pendingSecret: secret.base32 },
        },
      },
    });

    res.status(httpStatus.OK).json({
      success: true,
      data: { secret: secret.base32, otpauthUrl: secret.otpauth_url, method: 'totp' },
    });
  } catch (error) {
    next(error);
  }
}

async function verifyMfa(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }

    const { token } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const metadata = user?.metadata || {};
    const mfa = metadata.mfa || {};
    const pendingSecret = mfa.pendingSecret;
    if (!pendingSecret) {
      throw new AppError('MFA not pending', 400, errorCodes.VALIDATION.VALIDATION_ERROR);
    }

    const ok = speakeasy.totp.verify({ secret: pendingSecret, encoding: 'base32', token });
    if (!ok) {
      throw new AppError('Invalid MFA token', 400, errorCodes.AUTH.MFA_INVALID);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...metadata,
          mfa: { enabled: true, method: 'totp', secret: pendingSecret },
        },
      },
    });

    res.status(httpStatus.OK).json({ success: true, data: { enabled: true } });
  } catch (error) {
    next(error);
  }
}

async function disableMfa(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }

    const { token } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const metadata = user?.metadata || {};
    const mfa = metadata.mfa || {};
    if (!mfa.secret) {
      return res.status(httpStatus.OK).json({ success: true, data: { enabled: false } });
    }

    const ok = speakeasy.totp.verify({ secret: mfa.secret, encoding: 'base32', token });
    if (!ok) {
      throw new AppError('Invalid MFA token', 400, errorCodes.AUTH.MFA_INVALID);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...metadata,
          mfa: { enabled: false, method: 'totp' },
        },
      },
    });

    res.status(httpStatus.OK).json({ success: true, data: { enabled: false } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requestOtp,
  verifyOtp,
  passwordLogin,
  requestPasswordReset,
  confirmPasswordReset,
  refreshToken,
  logout,
  listSessions,
  revokeSession,
  getPublicKeys,
  enableMfa,
  verifyMfa,
  disableMfa,
};
