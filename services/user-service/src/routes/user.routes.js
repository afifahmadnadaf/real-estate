'use strict';

const { validateBody } = require('@real-estate/common');
const express = require('express');

const userController = require('../controllers/user.controller');
const userValidator = require('../validators/user.validator');

const router = express.Router();

// Current user endpoints
router.get('/me', userController.getMyProfile);

router.patch(
  '/me',
  validateBody(userValidator.updateProfileSchema),
  userController.updateMyProfile
);

router.get('/me/preferences', userController.getMyPreferences);

router.patch(
  '/me/preferences',
  validateBody(userValidator.updatePreferencesSchema),
  userController.updateMyPreferences
);

router.get('/me/consents', userController.getMyConsents);
router.patch('/me/consents', userController.updateMyConsents);
router.get('/me/security', userController.getMySecurity);
router.patch('/me/security', userController.updateMySecurity);
router.get('/me/activity', userController.getMyActivity);
router.post('/me/deactivate', userController.deactivateAccount);

router.post('/me/delete/request', userController.requestAccountDeletion);
router.post('/me/delete/confirm', userController.confirmAccountDeletion);
router.get('/me/export', userController.exportMyData);
router.post('/me/verify-email', userController.verifyEmail);
router.post('/me/verify-phone', userController.verifyPhone);

// Admin endpoints (protected at gateway level)
router.get('/:userId', userController.getUserById);

router.get('/', userController.searchUsers);

router.patch(
  '/:userId',
  validateBody(userValidator.adminUpdateUserSchema),
  userController.adminUpdateUser
);

router.post('/:userId/block', userController.blockUser);

router.post('/:userId/unblock', userController.unblockUser);

module.exports = router;
