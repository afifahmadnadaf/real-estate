'use strict';

const { z } = require('zod');

/**
 * Media event payload schemas
 */

// Media identifier
const mediaIdSchema = z.object({
  mediaId: z.string(),
});

// Media upload initiated
const mediaUploadInitiatedSchema = mediaIdSchema.extend({
  userId: z.string(),
  orgId: z.string().optional(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number().int(),
  bucket: z.string(),
  key: z.string(),
  initiatedAt: z.string().datetime(),
});

// Media upload completed
const mediaUploadCompletedSchema = mediaIdSchema.extend({
  userId: z.string(),
  orgId: z.string().optional(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number().int(),
  bucket: z.string(),
  key: z.string(),
  url: z.string().url(),
  completedAt: z.string().datetime(),
});

// Media processing started
const mediaProcessingStartedSchema = mediaIdSchema.extend({
  processorId: z.string(),
  operations: z.array(z.string()),
  startedAt: z.string().datetime(),
});

// Media processing completed
const mediaProcessingCompletedSchema = mediaIdSchema.extend({
  derivatives: z.array(
    z.object({
      size: z.string(),
      key: z.string(),
      url: z.string().url(),
      width: z.number().int().optional(),
      height: z.number().int().optional(),
      format: z.string().optional(),
    })
  ),
  dimensions: z
    .object({
      width: z.number().int(),
      height: z.number().int(),
    })
    .optional(),
  metadata: z
    .object({
      exifStripped: z.boolean().default(false),
      duration: z.number().optional(), // For videos
    })
    .optional(),
  completedAt: z.string().datetime(),
});

// Media processing failed
const mediaProcessingFailedSchema = mediaIdSchema.extend({
  error: z.string(),
  errorCode: z.string().optional(),
  retryCount: z.number().int().default(0),
  failedAt: z.string().datetime(),
});

// Media moderation flagged
const mediaModerationFlaggedSchema = mediaIdSchema.extend({
  flags: z.array(z.string()),
  score: z.number().min(0).max(1),
  moderationType: z.enum(['AUTO', 'MANUAL']),
  flaggedAt: z.string().datetime(),
});

// Media deleted
const mediaDeletedSchema = mediaIdSchema.extend({
  deletedBy: z.string(),
  deletedAt: z.string().datetime(),
  reason: z.string().optional(),
});

module.exports = {
  mediaIdSchema,
  mediaUploadInitiatedSchema,
  mediaUploadCompletedSchema,
  mediaProcessingStartedSchema,
  mediaProcessingCompletedSchema,
  mediaProcessingFailedSchema,
  mediaModerationFlaggedSchema,
  mediaDeletedSchema,
};
