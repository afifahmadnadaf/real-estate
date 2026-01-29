'use strict';

const { z } = require('zod');

/**
 * User event payload schemas
 */

// User identifier
const userIdSchema = z.object({
  userId: z.string(),
});

// User registered
const userRegisteredSchema = userIdSchema.extend({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  role: z.enum(['USER', 'AGENT', 'BUILDER', 'ADMIN']).default('USER'),
  registrationMethod: z.enum(['OTP', 'EMAIL', 'SOCIAL']),
  source: z.string().optional(), // Where they signed up from
  referralCode: z.string().optional(),
  registeredAt: z.string().datetime(),
});

// User verified
const userVerifiedSchema = userIdSchema.extend({
  verificationType: z.enum(['PHONE', 'EMAIL']),
  verifiedAt: z.string().datetime(),
});

// User profile updated
const userProfileUpdatedSchema = userIdSchema.extend({
  changes: z.array(
    z.object({
      field: z.string(),
      oldValue: z.any().optional(),
      newValue: z.any(),
    })
  ),
  updatedAt: z.string().datetime(),
});

// User password changed
const userPasswordChangedSchema = userIdSchema.extend({
  changeType: z.enum(['CHANGE', 'RESET']),
  changedAt: z.string().datetime(),
  ipAddress: z.string().optional(),
});

// User preferences updated
const userPreferencesUpdatedSchema = userIdSchema.extend({
  changes: z.record(z.any()),
  updatedAt: z.string().datetime(),
});

// User blocked
const userBlockedSchema = userIdSchema.extend({
  reason: z.string(),
  blockedBy: z.string(),
  blockedAt: z.string().datetime(),
  duration: z.string().optional(), // 'PERMANENT' or duration
});

// User unblocked
const userUnblockedSchema = userIdSchema.extend({
  unblockedBy: z.string(),
  unblockedAt: z.string().datetime(),
  reason: z.string().optional(),
});

// User deleted
const userDeletedSchema = userIdSchema.extend({
  deletionType: z.enum(['SOFT', 'HARD']),
  requestedBy: z.string(), // USER or ADMIN
  deletedAt: z.string().datetime(),
  reason: z.string().optional(),
});

// User session created
const userSessionCreatedSchema = userIdSchema.extend({
  sessionId: z.string(),
  deviceInfo: z
    .object({
      type: z.string().optional(),
      os: z.string().optional(),
      browser: z.string().optional(),
    })
    .optional(),
  ipAddress: z.string().optional(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

// User session revoked
const userSessionRevokedSchema = userIdSchema.extend({
  sessionId: z.string(),
  revokedBy: z.string(), // USER or ADMIN
  reason: z.enum(['LOGOUT', 'SECURITY', 'ADMIN', 'EXPIRED']),
  revokedAt: z.string().datetime(),
});

module.exports = {
  userIdSchema,
  userRegisteredSchema,
  userVerifiedSchema,
  userProfileUpdatedSchema,
  userPasswordChangedSchema,
  userPreferencesUpdatedSchema,
  userBlockedSchema,
  userUnblockedSchema,
  userDeletedSchema,
  userSessionCreatedSchema,
  userSessionRevokedSchema,
};
