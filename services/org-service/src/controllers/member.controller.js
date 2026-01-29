'use strict';

const { httpStatus } = require('@real-estate/common');

const memberService = require('../services/member.service');

/**
 * List members
 */
async function listMembers(req, res, next) {
  try {
    const { orgId } = req.params;
    const userId = req.headers['x-user-id'];

    const members = await memberService.listMembers(orgId, userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Invite member
 */
async function inviteMember(req, res, next) {
  try {
    const { orgId } = req.params;
    const userId = req.headers['x-user-id'];

    const member = await memberService.inviteMember(req.app, orgId, userId, req.body);

    res.status(httpStatus.CREATED).json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get member
 */
async function getMember(req, res, next) {
  try {
    const { orgId, memberId } = req.params;
    const userId = req.headers['x-user-id'];

    const member = await memberService.getMember(orgId, memberId, userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update member
 */
async function updateMember(req, res, next) {
  try {
    const { orgId, memberId } = req.params;
    const userId = req.headers['x-user-id'];

    const member = await memberService.updateMember(req.app, orgId, memberId, userId, req.body);

    res.status(httpStatus.OK).json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove member
 */
async function removeMember(req, res, next) {
  try {
    const { orgId, memberId } = req.params;
    const userId = req.headers['x-user-id'];

    await memberService.removeMember(req.app, orgId, memberId, userId);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Member removed',
    });
  } catch (error) {
    next(error);
  }
}

async function resendInvite(req, res, next) {
  try {
    const { orgId, memberId } = req.params;
    const userId = req.headers['x-user-id'];

    const invite = await memberService.resendInvite(req.app, orgId, memberId, userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: invite,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listMembers,
  inviteMember,
  resendInvite,
  getMember,
  updateMember,
  removeMember,
};
