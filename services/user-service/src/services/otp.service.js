'use strict';

const crypto = require('crypto');

const { AppError, errorCodes, hashToken, addMinutes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

const config = require('../config');

/**
 * Generate OTP
 */
function generateOtp(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(crypto.randomInt(min, max + 1)).padStart(length, '0');
}

/**
 * Send OTP
 */
async function sendOtp(app, identifier, identifierType, purpose) {
  const redis = app.get('redis');

  // Check rate limit
  const rateLimitKey = `otp:ratelimit:${identifier}`;
  const requestCount = await redis.incr(rateLimitKey);

  if (requestCount === 1) {
    // Set expiry on first request
    await redis.expire(rateLimitKey, 3600); // 1 hour
  }

  if (requestCount > config.otp.rateLimitPerHour) {
    throw new AppError(
      'Too many OTP requests. Please try again later.',
      429,
      errorCodes.AUTH.OTP_RATE_LIMITED
    );
  }

  // Generate OTP
  const otp = generateOtp(config.otp.length);
  const otpHash = hashToken(otp);
  const expiresAt = addMinutes(new Date(), config.otp.expiryMinutes);

  // Store OTP request
  await prisma.otpRequest.create({
    data: {
      identifier,
      identifierType,
      otpHash,
      purpose,
      attempts: 0,
      expiresAt,
    },
  });

  // Send OTP via appropriate channel
  if (identifierType === 'PHONE') {
    await sendSmsOtp(identifier, otp);
  } else {
    await sendEmailOtp(identifier, otp);
  }

  return true;
}

/**
 * Verify OTP
 */
async function verifyOtp(app, identifier, identifierType, otp, purpose) {
  // Find latest OTP request
  const otpRequest = await prisma.otpRequest.findFirst({
    where: {
      identifier,
      identifierType,
      purpose,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRequest) {
    throw new AppError('OTP expired or not found', 400, errorCodes.AUTH.OTP_EXPIRED);
  }

  // Check attempts
  if (otpRequest.attempts >= config.otp.maxAttempts) {
    throw new AppError('Maximum attempts exceeded', 400, errorCodes.AUTH.OTP_MAX_ATTEMPTS);
  }

  // Verify OTP hash
  const otpHash = hashToken(otp);
  if (otpHash !== otpRequest.otpHash) {
    // Increment attempts
    await prisma.otpRequest.update({
      where: { id: otpRequest.id },
      data: { attempts: { increment: 1 } },
    });

    throw new AppError('Invalid OTP', 400, errorCodes.AUTH.OTP_INVALID);
  }

  // Delete used OTP
  await prisma.otpRequest.delete({
    where: { id: otpRequest.id },
  });

  return true;
}

const { createLogger } = require('@real-estate/common');

const logger = createLogger({ service: 'user-service' });

let twilioClient = null;
let mailTransporter = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;
  if (config.sms.apiKey && config.sms.apiSecret) {
    try {
      const twilio = require('twilio');
      twilioClient = twilio(config.sms.apiKey, config.sms.apiSecret);
    } catch {
      return null;
    }
  }
  return twilioClient;
}

function getMailTransporter() {
  if (mailTransporter) return mailTransporter;
  if (config.sms.provider === 'sendgrid' || process.env.EMAIL_HOST) {
    try {
      const nodemailer = require('nodemailer');
      mailTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } catch {
      return null;
    }
  }
  return mailTransporter;
}

/**
 * Send SMS OTP
 */
async function sendSmsOtp(phone, otp) {
  const provider = config.sms.provider;

  if (provider === 'dummy' || config.env === 'test') {
    logger.info({ phone, otp }, '[SMS] Sending OTP (Mock)');
    return true;
  }

  if (provider === 'twilio') {
    const client = getTwilioClient();
    if (client) {
      try {
        await client.messages.create({
          body: `Your verification code is ${otp}`,
          from: config.sms.senderId || undefined,
          to: phone
        });
        logger.info({ phone }, '[SMS] OTP sent via Twilio');
        return true;
      } catch (err) {
        logger.error({ error: err.message, phone }, '[SMS] Failed to send via Twilio');
        throw new Error('Failed to send SMS');
      }
    }
  }

  logger.warn({ phone }, 'SMS provider not configured properly, falling back to mock');
  return true; 
}

/**
 * Send Email OTP
 */
async function sendEmailOtp(email, otp) {
  if (config.env === 'test') {
    logger.info({ email, otp }, '[EMAIL] Sending OTP (Mock)');
    return true;
  }

  const transporter = getMailTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@realestate.com',
        to: email,
        subject: 'Your Verification Code',
        text: `Your verification code is: ${otp}`,
        html: `<p>Your verification code is: <strong>${otp}</strong></p>`
      });
      logger.info({ email }, '[EMAIL] OTP sent via SMTP/SendGrid');
      return true;
    } catch (err) {
      logger.error({ error: err.message, email }, '[EMAIL] Failed to send email');
      throw new Error('Failed to send email');
    }
  }

  // Fallback log
  logger.info({ email, otp }, '[EMAIL] Provider not configured, simulating delivery');
  return true;
}

module.exports = {
  generateOtp,
  sendOtp,
  verifyOtp,
};
