'use strict';

const Joi = require('joi');

/**
 * Submit KYC schema
 */
const submitKycSchema = Joi.object({
  documentType: Joi.string()
    .valid('PAN', 'GST', 'RERA', 'ADDRESS_PROOF', 'COMPANY_REGISTRATION')
    .required(),
  documentNumber: Joi.string().optional(),
  documentUrl: Joi.string().uri().required(),
});

/**
 * Update KYC schema
 */
const updateKycSchema = Joi.object({
  documentNumber: Joi.string().optional(),
  documentUrl: Joi.string().uri().optional(),
});

module.exports = {
  submitKycSchema,
  updateKycSchema,
};
