'use strict';

const { z } = require('zod');

/**
 * Moderation event payload schemas
 */

// Task identifier
const taskIdSchema = z.object({
  taskId: z.string(),
});

// Moderation task created
const taskCreatedSchema = taskIdSchema.extend({
  entityType: z.enum(['PROPERTY', 'PROJECT', 'ORGANIZATION', 'USER', 'REVIEW', 'REPORT']),
  entityId: z.string(),
  taskType: z.enum(['NEW_LISTING', 'UPDATE', 'REPORT', 'KYC', 'CONTENT']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  autoScore: z.number().min(0).max(100).optional(),
  createdAt: z.string().datetime(),
});

// Moderation task claimed
const taskClaimedSchema = taskIdSchema.extend({
  claimedBy: z.string(),
  claimedAt: z.string().datetime(),
});

// Moderation task released
const taskReleasedSchema = taskIdSchema.extend({
  releasedBy: z.string(),
  releasedAt: z.string().datetime(),
  reason: z.string().optional(),
});

// Moderation task decided
const taskDecidedSchema = taskIdSchema.extend({
  entityType: z.string(),
  entityId: z.string(),
  decision: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES']),
  reviewedBy: z.string(),
  reviewNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  rejectionDetails: z.array(z.string()).optional(),
  decidedAt: z.string().datetime(),
});

// Moderation rule triggered
const ruleTriggeredSchema = z.object({
  ruleId: z.string(),
  ruleName: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  matchedConditions: z.array(z.string()),
  actions: z.array(z.string()),
  triggeredAt: z.string().datetime(),
});

// Auto-moderation result
const autoModerationSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  result: z.enum(['APPROVED', 'REJECTED', 'REVIEW_REQUIRED']),
  score: z.number().min(0).max(100),
  flags: z.array(z.string()).optional(),
  rulesTriggered: z.array(z.string()).optional(),
  processedAt: z.string().datetime(),
});

module.exports = {
  taskIdSchema,
  taskCreatedSchema,
  taskClaimedSchema,
  taskReleasedSchema,
  taskDecidedSchema,
  ruleTriggeredSchema,
  autoModerationSchema,
};
