'use strict';

const { validate } = require('@real-estate/common');
const Joi = require('joi');

// Create role schema
const createRoleSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  slug: Joi.string().required(),
  description: Joi.string().max(500).optional(),
  permissions: Joi.object().required(),
  isSystem: Joi.boolean().default(false),
});

// Update role schema
const updateRoleSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional(),
  permissions: Joi.object().optional(),
});

// Assign role schema
const assignRoleSchema = Joi.object({
  userId: Joi.string().required(),
  roleId: Joi.string().required(),
});

// Revoke role schema
const revokeRoleSchema = Joi.object({
  userId: Joi.string().required(),
  roleId: Joi.string().required(),
});

// ID parameter schema
const idParamSchema = Joi.object({
  id: Joi.string().required(),
});

module.exports = {
  validateCreateRole: validate(createRoleSchema),
  validateUpdateRole: validate(updateRoleSchema),
  validateAssignRole: validate(assignRoleSchema),
  validateRevokeRole: validate(revokeRoleSchema),
  validateIdParam: validate(idParamSchema, 'params'),
};
