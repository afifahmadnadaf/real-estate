'use strict';

const Joi = require('joi');

/**
 * Invite member schema
 */
const inviteMemberSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('ADMIN', 'MANAGER', 'MEMBER').default('MEMBER'),
  title: Joi.string().max(100).optional(),
});

/**
 * Update member schema
 */
const updateMemberSchema = Joi.object({
  role: Joi.string().valid('ADMIN', 'MANAGER', 'MEMBER').optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
  title: Joi.string().max(100).optional().allow(null, ''),
});

module.exports = {
  inviteMemberSchema,
  updateMemberSchema,
};
