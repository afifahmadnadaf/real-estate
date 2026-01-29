'use strict';

const { z } = require('zod');

/**
 * Lead event payload schemas
 */

// Lead identifier
const leadIdSchema = z.object({
  leadId: z.string(),
});

// Lead created
const leadCreatedSchema = leadIdSchema.extend({
  propertyId: z.string().optional(),
  projectId: z.string().optional(),
  buyerId: z.string().optional(),
  sellerId: z.string(),
  orgId: z.string().optional(),
  source: z.enum([
    'PROPERTY_PAGE',
    'SEARCH',
    'SHORTLIST',
    'CONTACT_FORM',
    'PHONE',
    'WHATSAPP',
    'CHAT',
    'PARTNER',
  ]),
  buyer: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().email().optional(),
  }),
  message: z.string().optional(),
  budget: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  createdAt: z.string().datetime(),
});

// Lead assigned
const leadAssignedSchema = leadIdSchema.extend({
  assignedTo: z.string(),
  assignedBy: z.string(),
  previousAssignee: z.string().optional(),
  assignedAt: z.string().datetime(),
});

// Lead status changed
const leadStatusChangedSchema = leadIdSchema.extend({
  previousStatus: z.string(),
  newStatus: z.string(),
  changedBy: z.string(),
  changedAt: z.string().datetime(),
  notes: z.string().optional(),
});

// Lead note added
const leadNoteAddedSchema = leadIdSchema.extend({
  noteId: z.string(),
  authorId: z.string(),
  content: z.string(),
  isInternal: z.boolean().default(true),
  createdAt: z.string().datetime(),
});

// Lead appointment scheduled
const leadAppointmentSchema = leadIdSchema.extend({
  appointmentId: z.string(),
  propertyId: z.string().optional(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().default(60),
  location: z.string().optional(),
  notes: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.string().datetime(),
});

// Lead converted
const leadConvertedSchema = leadIdSchema.extend({
  convertedAt: z.string().datetime(),
  convertedBy: z.string(),
  transactionType: z.enum(['SALE', 'RENT']).optional(),
  transactionValue: z.number().optional(),
  notes: z.string().optional(),
});

// Lead marked spam
const leadSpamSchema = leadIdSchema.extend({
  markedBy: z.string(),
  markedAt: z.string().datetime(),
  reason: z.string().optional(),
  spamScore: z.number().min(0).max(1).optional(),
});

module.exports = {
  leadIdSchema,
  leadCreatedSchema,
  leadAssignedSchema,
  leadStatusChangedSchema,
  leadNoteAddedSchema,
  leadAppointmentSchema,
  leadConvertedSchema,
  leadSpamSchema,
};
