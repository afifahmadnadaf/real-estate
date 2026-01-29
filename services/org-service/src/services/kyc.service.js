'use strict';

const { AppError, errorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');
const { EVENT_TYPES } = require('@real-estate/events');

/**
 * Submit KYC document
 */
async function submitKyc(app, orgId, userId, data) {
  // Check membership
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

  const kyc = await prisma.kycDocument.create({
    data: {
      orgId,
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      documentUrl: data.documentUrl,
      status: 'PENDING',
      submittedById: userId,
    },
  });

  // Publish event
  const eventProducer = app.get('eventProducer');
  if (eventProducer) {
    await eventProducer.publish(
      'user.events.v1',
      EVENT_TYPES.ORG?.KYC_SUBMITTED || 'org.kyc.submitted',
      {
        orgId,
        kycId: kyc.id,
        documentType: data.documentType,
        submittedBy: userId,
        submittedAt: new Date().toISOString(),
      }
    );
  }

  return kyc;
}

/**
 * List KYC documents
 */
async function listKycDocs(orgId, userId) {
  // Check access
  const member = await prisma.orgMember.findFirst({
    where: {
      orgId,
      userId,
      status: 'ACTIVE',
    },
  });

  if (!member) {
    throw new AppError('Access denied', 403, errorCodes.AUTHORIZATION.ORG_ACCESS_DENIED);
  }

  const docs = await prisma.kycDocument.findMany({
    where: { orgId },
    orderBy: { submittedAt: 'desc' },
  });

  return docs;
}

/**
 * Get KYC document
 */
async function getKycDoc(orgId, kycId, _userId) {
  const doc = await prisma.kycDocument.findFirst({
    where: { id: kycId, orgId },
  });

  if (!doc) {
    throw new AppError('Document not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }

  return doc;
}

/**
 * Update KYC document
 */
async function updateKycDoc(app, orgId, kycId, userId, data) {
  // Check membership
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

  const doc = await prisma.kycDocument.update({
    where: { id: kycId },
    data: {
      ...data,
      status: 'PENDING', // Reset to pending on update
    },
  });

  return doc;
}

async function withdrawKycDoc(app, orgId, kycId, userId) {
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

  const existing = await prisma.kycDocument.findFirst({
    where: { id: kycId, orgId },
  });

  if (!existing) {
    throw new AppError('Document not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }

  await prisma.kycDocument.delete({
    where: { id: kycId },
  });

  const eventProducer = app.get('eventProducer');
  if (eventProducer) {
    await eventProducer.publish(
      'user.events.v1',
      EVENT_TYPES.ORG?.KYC_WITHDRAWN || 'org.kyc.withdrawn',
      {
        orgId,
        kycId,
        withdrawnBy: userId,
        withdrawnAt: new Date().toISOString(),
      }
    );
  }

  return { success: true };
}

/**
 * Get verification status
 */
async function getVerificationStatus(orgId, _userId) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { status: true, metadata: true },
  });

  if (!org) {
    throw new AppError('Organization not found', 404, errorCodes.RESOURCE.ORG_NOT_FOUND);
  }

  const kycDocs = await prisma.kycDocument.findMany({
    where: { orgId },
    select: { documentType: true, status: true },
  });

  return {
    orgStatus: org.status,
    requestedChanges: org.metadata?.requestedChanges || null,
    documents: kycDocs,
    isFullyVerified: org.status === 'VERIFIED',
  };
}

module.exports = {
  submitKyc,
  listKycDocs,
  getKycDoc,
  updateKycDoc,
  withdrawKycDoc,
  getVerificationStatus,
};
