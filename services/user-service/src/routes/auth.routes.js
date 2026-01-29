'use strict';

const { validateBody } = require('@real-estate/common');
const express = require('express');

const authController = require('../controllers/auth.controller');
const authValidator = require('../validators/auth.validator');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      endpoints: [
        // 'GET /v1/auth/public-keys',
        // 'POST /v1/auth/otp/request',
        // 'POST /v1/auth/otp/verify',
        // 'POST /v1/auth/password/login',
        // 'POST /v1/auth/password/reset/request',
        // 'POST /v1/auth/password/reset/confirm',
        // 'POST /v1/auth/refresh',
        // 'POST /v1/auth/logout',
        // 'GET /v1/auth/sessions',
        // 'DELETE /v1/auth/sessions/:sessionId',
        // 'POST /v1/auth/mfa/enable',
        // 'POST /v1/auth/mfa/verify',
        // 'POST /v1/auth/mfa/disable',
      ],
    },
  });
});

router.get('/public-keys', authController.getPublicKeys);

// OTP endpoints
router.post(
  '/otp/request',
  validateBody(authValidator.requestOtpSchema),
  authController.requestOtp
);

router.post('/otp/verify', validateBody(authValidator.verifyOtpSchema), authController.verifyOtp);

// Password endpoints
router.post(
  '/password/login',
  validateBody(authValidator.passwordLoginSchema),
  authController.passwordLogin
);

router.post(
  '/password/reset/request',
  validateBody(authValidator.resetPasswordRequestSchema),
  authController.requestPasswordReset
);

router.post(
  '/password/reset/confirm',
  validateBody(authValidator.resetPasswordConfirmSchema),
  authController.confirmPasswordReset
);

// Session endpoints
router.post(
  '/refresh',
  validateBody(authValidator.refreshTokenSchema),
  authController.refreshToken
);

router.post('/logout', authController.logout);

router.get('/sessions', authController.listSessions);

router.delete('/sessions/:sessionId', authController.revokeSession);

router.post('/mfa/enable', validateBody(authValidator.mfaEnableSchema), authController.enableMfa);
router.post('/mfa/verify', validateBody(authValidator.mfaVerifySchema), authController.verifyMfa);
router.post('/mfa/disable', validateBody(authValidator.mfaVerifySchema), authController.disableMfa);

module.exports = router;
