'use strict';

const { validateBody } = require('@real-estate/common');
const express = require('express');

const memberController = require('../controllers/member.controller');
const memberValidator = require('../validators/member.validator');

const router = express.Router();

// List members
router.get('/:orgId/members', memberController.listMembers);

// Invite/add member
router.post(
  '/:orgId/members',
  validateBody(memberValidator.inviteMemberSchema),
  memberController.inviteMember
);

// Get member
router.get('/:orgId/members/:memberId', memberController.getMember);

// Update member role/status
router.patch(
  '/:orgId/members/:memberId',
  validateBody(memberValidator.updateMemberSchema),
  memberController.updateMember
);

// Remove member
router.delete('/:orgId/members/:memberId', memberController.removeMember);

// Resend invite (supports inviteId as memberId)
router.post('/:orgId/members/:memberId/resend-invite', memberController.resendInvite);

module.exports = router;
