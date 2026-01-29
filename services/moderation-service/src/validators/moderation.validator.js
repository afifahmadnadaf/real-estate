'use strict';

const { validate } = require('@real-estate/common');
const Joi = require('joi');

// Task ID parameter
const taskIdParamSchema = Joi.object({
  taskId: Joi.string().required(),
});

// Rule ID parameter
const ruleIdParamSchema = Joi.object({
  id: Joi.string().required(),
});

// Queue query schema
const queueQuerySchema = Joi.object({
  status: Joi.string().valid('PENDING', 'CLAIMED', 'COMPLETED', 'CANCELLED').optional(),
  taskType: Joi.string().valid('NEW_LISTING', 'UPDATE', 'REPORT', 'KYC', 'CONTENT').optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
});

// Decision schema
const decisionSchema = Joi.object({
  decision: Joi.string().valid('APPROVE', 'REJECT', 'REQUEST_CHANGES').required(),
  notes: Joi.string().max(1000).allow('').optional(),
});

// Comment schema
const commentSchema = Joi.object({
  comment: Joi.string().required().max(500),
});

// Rule creation schema
const createRuleSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().max(500).optional(),
  entityType: Joi.string().required(),
  conditions: Joi.object().required(),
  actions: Joi.object().required(),
  priority: Joi.number().integer().default(0),
  isActive: Joi.boolean().default(true),
});

// Rule update schema
const updateRuleSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(500).optional(),
  conditions: Joi.object().optional(),
  actions: Joi.object().optional(),
  priority: Joi.number().integer().optional(),
  isActive: Joi.boolean().optional(),
});

// List rules query schema
const listRulesQuerySchema = Joi.object({
  entityType: Joi.string().optional(),
  isActive: Joi.string().valid('true', 'false').optional(),
});

module.exports = {
  validateTaskIdParam: validate(taskIdParamSchema, 'params'),
  validateRuleIdParam: validate(ruleIdParamSchema, 'params'),
  validateQueueQuery: validate(queueQuerySchema, 'query'),
  validateDecision: validate(decisionSchema),
  validateComment: validate(commentSchema),
  validateCreateRule: validate(createRuleSchema),
  validateUpdateRule: validate(updateRuleSchema),
  validateListRulesQuery: validate(listRulesQuerySchema, 'query'),
};
