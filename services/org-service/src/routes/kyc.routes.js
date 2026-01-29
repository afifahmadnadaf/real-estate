'use strict';

const { validateBody } = require('@real-estate/common');
const express = require('express');

const kycController = require('../controllers/kyc.controller');
const kycValidator = require('../validators/kyc.validator');

const router = express.Router();

// Submit KYC document
router.post('/:orgId/kyc', validateBody(kycValidator.submitKycSchema), kycController.submitKyc);

// List KYC documents
router.get('/:orgId/kyc', kycController.listKycDocs);

// Get KYC document
router.get('/:orgId/kyc/:kycId', kycController.getKycDoc);

// Update KYC document
router.patch(
  '/:orgId/kyc/:kycId',
  validateBody(kycValidator.updateKycSchema),
  kycController.updateKycDoc
);

router.post('/:orgId/kyc/:kycId/withdraw', kycController.withdrawKycDoc);

// Get verification status
router.get('/:orgId/verification/status', kycController.getVerificationStatus);

module.exports = router;
