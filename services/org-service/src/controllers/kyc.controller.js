'use strict';

const { httpStatus } = require('@real-estate/common');

const kycService = require('../services/kyc.service');

/**
 * Submit KYC document
 */
async function submitKyc(req, res, next) {
  try {
    const { orgId } = req.params;
    const userId = req.headers['x-user-id'];

    const kyc = await kycService.submitKyc(req.app, orgId, userId, req.body);

    res.status(httpStatus.CREATED).json({
      success: true,
      data: kyc,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List KYC documents
 */
async function listKycDocs(req, res, next) {
  try {
    const { orgId } = req.params;
    const userId = req.headers['x-user-id'];

    const docs = await kycService.listKycDocs(orgId, userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: docs,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get KYC document
 */
async function getKycDoc(req, res, next) {
  try {
    const { orgId, kycId } = req.params;
    const userId = req.headers['x-user-id'];

    const doc = await kycService.getKycDoc(orgId, kycId, userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update KYC document
 */
async function updateKycDoc(req, res, next) {
  try {
    const { orgId, kycId } = req.params;
    const userId = req.headers['x-user-id'];

    const doc = await kycService.updateKycDoc(req.app, orgId, kycId, userId, req.body);

    res.status(httpStatus.OK).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    next(error);
  }
}

async function withdrawKycDoc(req, res, next) {
  try {
    const { orgId, kycId } = req.params;
    const userId = req.headers['x-user-id'];

    const result = await kycService.withdrawKycDoc(req.app, orgId, kycId, userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get verification status
 */
async function getVerificationStatus(req, res, next) {
  try {
    const { orgId } = req.params;
    const userId = req.headers['x-user-id'];

    const status = await kycService.getVerificationStatus(orgId, userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitKyc,
  listKycDocs,
  getKycDoc,
  updateKycDoc,
  withdrawKycDoc,
  getVerificationStatus,
};
