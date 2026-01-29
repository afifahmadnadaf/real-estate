'use strict';

const { validate } = require('@real-estate/common');
const Joi = require('joi');

// Create lead schema
const createLeadSchema = Joi.object({
  propertyId: Joi.string().optional(),
  projectId: Joi.string().optional(),
  sellerId: Joi.string().required(),
  orgId: Joi.string().optional(),
  source: Joi.string()
    .valid(
      'PROPERTY_PAGE',
      'SEARCH',
      'SHORTLIST',
      'CONTACT_FORM',
      'PHONE',
      'WHATSAPP',
      'CHAT',
      'PARTNER'
    )
    .required(),
  message: Joi.string().max(1000).optional(),
  contactPreference: Joi.string().valid('PHONE', 'EMAIL', 'WHATSAPP').optional(),
  buyerName: Joi.string().required().min(2).max(100),
  buyerPhone: Joi.string().required(),
  buyerEmail: Joi.string().email().optional(),
  budgetMin: Joi.number().min(0).optional(),
  budgetMax: Joi.number().min(0).optional(),
  preferredLocalities: Joi.array().items(Joi.string()).optional(),
  metadata: Joi.object().optional(),
});

// Update lead status schema
const updateLeadStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      'NEW',
      'CONTACTED',
      'INTERESTED',
      'SITE_VISIT_SCHEDULED',
      'SITE_VISIT_DONE',
      'NEGOTIATING',
      'CONVERTED',
      'LOST',
      'SPAM'
    )
    .required(),
});

// Assign lead schema
const assignLeadSchema = Joi.object({
  assignedToId: Joi.string().required(),
});

// Add note schema
const addNoteSchema = Joi.object({
  content: Joi.string().required().min(1).max(1000),
  isInternal: Joi.boolean().default(true),
});

// Create appointment schema
const createAppointmentSchema = Joi.object({
  propertyId: Joi.string().optional(),
  scheduledAt: Joi.date().required(),
  durationMinutes: Joi.number().integer().min(15).max(480).default(60),
  location: Joi.string().max(500).optional(),
  notes: Joi.string().max(1000).optional(),
});

// Update appointment schema
const updateAppointmentSchema = Joi.object({
  appointmentId: Joi.string().required(),
  scheduledAt: Joi.date().optional(),
  durationMinutes: Joi.number().integer().min(15).max(480).optional(),
  location: Joi.string().max(500).optional(),
  notes: Joi.string().max(1000).optional(),
  status: Joi.string()
    .valid('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')
    .optional(),
});

// Cancel appointment schema
const cancelAppointmentSchema = Joi.object({
  appointmentId: Joi.string().required(),
});

// ID parameter schema
const idParamSchema = Joi.object({
  id: Joi.string().required(),
});

// List leads query schema
const listLeadsQuerySchema = Joi.object({
  status: Joi.string()
    .valid(
      'NEW',
      'CONTACTED',
      'INTERESTED',
      'SITE_VISIT_SCHEDULED',
      'SITE_VISIT_DONE',
      'NEGOTIATING',
      'CONVERTED',
      'LOST',
      'SPAM'
    )
    .optional(),
  source: Joi.string()
    .valid(
      'PROPERTY_PAGE',
      'SEARCH',
      'SHORTLIST',
      'CONTACT_FORM',
      'PHONE',
      'WHATSAPP',
      'CHAT',
      'PARTNER'
    )
    .optional(),
  assignedToId: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

module.exports = {
  validateCreateLead: validate(createLeadSchema),
  validateUpdateLeadStatus: validate(updateLeadStatusSchema),
  validateAssignLead: validate(assignLeadSchema),
  validateAddNote: validate(addNoteSchema),
  validateCreateAppointment: validate(createAppointmentSchema),
  validateUpdateAppointment: validate(updateAppointmentSchema),
  validateCancelAppointment: validate(cancelAppointmentSchema),
  validateIdParam: validate(idParamSchema, 'params'),
  validateListLeadsQuery: validate(listLeadsQuerySchema, 'query'),
};
