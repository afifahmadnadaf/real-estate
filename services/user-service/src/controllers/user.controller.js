'use strict';

const { AppError, errorCodes, httpStatus } = require('@real-estate/common');

const userService = require('../services/user.service');

/**
 * Get current user profile
 */
async function getMyProfile(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }

    const user = await userService.getUserById(userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update current user profile
 */
async function updateMyProfile(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }

    const user = await userService.updateUser(req.app, userId, req.body);

    res.status(httpStatus.OK).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user preferences
 */
async function getMyPreferences(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }

    const preferences = await userService.getUserPreferences(userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user preferences
 */
async function updateMyPreferences(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }

    const preferences = await userService.updateUserPreferences(userId, req.body);

    res.status(httpStatus.OK).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyConsents(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }
    const consents = await userService.getUserConsents(userId);
    res.status(httpStatus.OK).json({
      success: true,
      data: consents,
    });
  } catch (error) {
    next(error);
  }
}

async function updateMyConsents(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }
    const consents = await userService.updateUserConsents(
      userId,
      req.body?.consents || req.body || {}
    );
    res.status(httpStatus.OK).json({
      success: true,
      data: consents,
    });
  } catch (error) {
    next(error);
  }
}

async function getMySecurity(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }
    const security = await userService.getSecuritySettings(userId);
    res.status(httpStatus.OK).json({
      success: true,
      data: security,
    });
  } catch (error) {
    next(error);
  }
}

async function updateMySecurity(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }
    const user = await userService.updateSecuritySettings(userId, req.body || {});
    res.status(httpStatus.OK).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyActivity(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }
    const activity = await userService.getUserActivity(userId, {
      limit: parseInt(req.query.limit, 10) || 20,
    });
    res.status(httpStatus.OK).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
}

async function deactivateAccount(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }
    await userService.deactivateUser(req.app, userId);
    res.status(httpStatus.OK).json({
      success: true,
      message: 'Account deactivated',
    });
  } catch (error) {
    next(error);
  }
}

async function confirmAccountDeletion(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }
    await userService.requestAccountDeletion(req.app, userId);
    res.status(httpStatus.OK).json({
      success: true,
      message: 'Account deletion confirmed',
    });
  } catch (error) {
    next(error);
  }
}

async function exportMyData(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }
    const data = await userService.exportUserData(userId);
    res.status(httpStatus.OK).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }
    const user = await userService.verifyEmail(userId);
    res.status(httpStatus.OK).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

async function verifyPhone(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }
    const user = await userService.verifyPhone(userId);
    res.status(httpStatus.OK).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Request account deletion
 */
async function requestAccountDeletion(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      throw new AppError('User ID required', 401, errorCodes.AUTH.TOKEN_INVALID);
    }

    await userService.requestAccountDeletion(req.app, userId);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Account deletion request submitted',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user by ID (admin)
 */
async function getUserById(req, res, next) {
  try {
    const { userId } = req.params;

    const user = await userService.getUserById(userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Search users (admin)
 */
async function searchUsers(req, res, next) {
  try {
    const result = await userService.searchUsers(req.query);

    res.status(httpStatus.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin update user
 */
async function adminUpdateUser(req, res, next) {
  try {
    const { userId } = req.params;
    const adminId = req.headers['x-user-id'];

    const user = await userService.adminUpdateUser(req.app, userId, req.body, adminId);

    res.status(httpStatus.OK).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Block user (admin)
 */
async function blockUser(req, res, next) {
  try {
    const { userId } = req.params;
    const adminId = req.headers['x-user-id'];
    const { reason } = req.body;

    await userService.blockUser(req.app, userId, adminId, reason);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'User blocked',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Unblock user (admin)
 */
async function unblockUser(req, res, next) {
  try {
    const { userId } = req.params;
    const adminId = req.headers['x-user-id'];

    await userService.unblockUser(req.app, userId, adminId);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'User unblocked',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  getMyPreferences,
  updateMyPreferences,
  getMyConsents,
  updateMyConsents,
  getMySecurity,
  updateMySecurity,
  getMyActivity,
  deactivateAccount,
  requestAccountDeletion,
  confirmAccountDeletion,
  exportMyData,
  verifyEmail,
  verifyPhone,
  getUserById,
  searchUsers,
  adminUpdateUser,
  blockUser,
  unblockUser,
};
