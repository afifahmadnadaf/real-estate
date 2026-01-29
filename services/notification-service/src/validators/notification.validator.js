'use strict';

const { validate } = require('@real-estate/common');
const Joi = require('joi');

// Update preferences schema
const updatePreferencesSchema = Joi.object({
  email: Joi.boolean().optional(),
  sms: Joi.boolean().optional(),
  push: Joi.boolean().optional(),
  whatsapp: Joi.boolean().optional(),
});

// Create template schema
const createTemplateSchema = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required().min(2).max(100),
  category: Joi.string().required(),
  channels: Joi.array()
    .items(Joi.string().valid('EMAIL', 'SMS', 'PUSH', 'WHATSAPP'))
    .required(),
  subject: Joi.string().max(200).optional(),
  smsBody: Joi.string().max(500).optional(),
  emailSubject: Joi.string().max(200).optional(),
  emailBody: Joi.string().optional(),
  pushTitle: Joi.string().max(100).optional(),
  pushBody: Joi.string().max(500).optional(),
  whatsappTemplateId: Joi.string().optional(),
  variables: Joi.object().optional(),
  isActive: Joi.boolean().default(true),
});

// Update template schema
const updateTemplateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  category: Joi.string().optional(),
  channels: Joi.array()
    .items(Joi.string().valid('EMAIL', 'SMS', 'PUSH', 'WHATSAPP'))
    .optional(),
  subject: Joi.string().max(200).optional(),
  smsBody: Joi.string().max(500).optional(),
  emailSubject: Joi.string().max(200).optional(),
  emailBody: Joi.string().optional(),
  pushTitle: Joi.string().max(100).optional(),
  pushBody: Joi.string().max(500).optional(),
  whatsappTemplateId: Joi.string().optional(),
  variables: Joi.object().optional(),
  isActive: Joi.boolean().optional(),
});

// Send test schema
const sendTestSchema = Joi.object({
  userId: Joi.string().required(),
  templateCode: Joi.string().required(),
  channels: Joi.array()
    .items(Joi.string().valid('EMAIL', 'SMS', 'PUSH', 'WHATSAPP'))
    .optional(),
  variables: Joi.object().optional(),
});

// ID parameter schema
const idParamSchema = Joi.object({
  id: Joi.string().required(),
});

module.exports = {
  validateUpdatePreferences: validate(updatePreferencesSchema),
  validateCreateTemplate: validate(createTemplateSchema),
  validateUpdateTemplate: validate(updateTemplateSchema),
  validateSendTest: validate(sendTestSchema),
  validateIdParam: validate(idParamSchema, 'params'),
};
