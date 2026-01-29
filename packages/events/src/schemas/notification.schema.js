'use strict';

const { z } = require('zod');

/**
 * Notification event payload schemas
 */

// Notification identifier
const notificationIdSchema = z.object({
  notificationId: z.string(),
});

// Notification requested (to be sent)
const notificationRequestedSchema = notificationIdSchema.extend({
  userId: z.string(),
  templateCode: z.string(),
  channels: z.array(z.enum(['SMS', 'EMAIL', 'PUSH', 'WHATSAPP', 'IN_APP'])),
  recipient: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    pushToken: z.string().optional(),
  }),
  variables: z.record(z.any()).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL'),
  scheduledAt: z.string().datetime().optional(),
  requestedAt: z.string().datetime(),
});

// Notification sent
const notificationSentSchema = notificationIdSchema.extend({
  userId: z.string(),
  channel: z.enum(['SMS', 'EMAIL', 'PUSH', 'WHATSAPP', 'IN_APP']),
  templateCode: z.string(),
  recipient: z.string(),
  providerId: z.string().optional(), // External provider message ID
  sentAt: z.string().datetime(),
});

// Notification delivered
const notificationDeliveredSchema = notificationIdSchema.extend({
  userId: z.string(),
  channel: z.string(),
  providerId: z.string().optional(),
  deliveredAt: z.string().datetime(),
});

// Notification failed
const notificationFailedSchema = notificationIdSchema.extend({
  userId: z.string(),
  channel: z.string(),
  templateCode: z.string(),
  error: z.string(),
  errorCode: z.string().optional(),
  retryCount: z.number().int().default(0),
  failedAt: z.string().datetime(),
});

// Notification read (for in-app)
const notificationReadSchema = notificationIdSchema.extend({
  userId: z.string(),
  readAt: z.string().datetime(),
});

module.exports = {
  notificationIdSchema,
  notificationRequestedSchema,
  notificationSentSchema,
  notificationDeliveredSchema,
  notificationFailedSchema,
  notificationReadSchema,
};
