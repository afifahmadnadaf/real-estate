'use strict';

const Joi = require('joi');

/**
 * Request OTP schema
 */
const requestOtpSchema = Joi.object({
  identifier: Joi.string().required().messages({
    'any.required': 'Phone number or email is required',
  }),
  identifierType: Joi.string().valid('PHONE', 'EMAIL').required().messages({
    'any.only': 'Identifier type must be PHONE or EMAIL',
  }),
  purpose: Joi.string().valid('LOGIN', 'REGISTER', 'RESET_PASSWORD', 'VERIFY').default('LOGIN'),
});

/**
 * Verify OTP schema
 */
const verifyOtpSchema = Joi.object({
  identifier: Joi.string().required(),
  identifierType: Joi.string().valid('PHONE', 'EMAIL').required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only numbers',
  }),
  purpose: Joi.string().valid('LOGIN', 'REGISTER', 'VERIFY').default('LOGIN'),
  deviceInfo: Joi.object({
    type: Joi.string(),
    os: Joi.string(),
    browser: Joi.string(),
    model: Joi.string(),
  }).optional(),
});

/**
 * Password login schema
 */
const passwordLoginSchema = Joi.object({
  identifier: Joi.string().required().messages({
    'any.required': 'Email or phone is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
  }),
  deviceInfo: Joi.object({
    type: Joi.string(),
    os: Joi.string(),
    browser: Joi.string(),
  }).optional(),
});

/**
 * Request password reset schema
 */
const resetPasswordRequestSchema = Joi.object({
  identifier: Joi.string().required(),
  identifierType: Joi.string().valid('PHONE', 'EMAIL').required(),
});

/**
 * Confirm password reset schema
 */
const resetPasswordConfirmSchema = Joi.object({
  identifier: Joi.string().required(),
  identifierType: Joi.string().valid('PHONE', 'EMAIL').required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
  }),
});

/**
 * Refresh token schema
 */
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

const mfaEnableSchema = Joi.object({});

const mfaVerifySchema = Joi.object({
  token: Joi.string().length(6).pattern(/^\d+$/).required(),
});

module.exports = {
  requestOtpSchema,
  verifyOtpSchema,
  passwordLoginSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
  refreshTokenSchema,
  mfaEnableSchema,
  mfaVerifySchema,
};
