'use strict';

const crypto = require('crypto');

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @param {number} [rounds] - Salt rounds
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password, rounds = SALT_ROUNDS) {
  return bcrypt.hash(password, rounds);
}

/**
 * Compare a password with a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if matches
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Hash a token using SHA-256 (for refresh tokens, API keys, etc.)
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a secure random token
 * @param {number} [length=32] - Token length in bytes (output will be hex, so 2x length)
 * @returns {string} Random token
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a numeric OTP
 * @param {number} [length=6] - OTP length
 * @returns {string} Numeric OTP
 */
function generateOTP(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const otp = crypto.randomInt(min, max + 1);
  return String(otp).padStart(length, '0');
}

/**
 * Generate a short unique ID (URL-safe)
 * @param {number} [length=12] - ID length
 * @returns {string} Short ID
 */
function generateShortId(length = 12) {
  const bytes = crypto.randomBytes(Math.ceil((length * 3) / 4));
  return bytes
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .slice(0, length);
}

/**
 * Encrypt data using AES-256-GCM
 * @param {string} text - Text to encrypt
 * @param {string} key - Encryption key (32 bytes hex)
 * @returns {string} Encrypted text (iv:authTag:ciphertext)
 */
function encrypt(text, key) {
  const keyBuffer = Buffer.from(key, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encryptedData - Encrypted text (iv:authTag:ciphertext)
 * @param {string} key - Encryption key (32 bytes hex)
 * @returns {string} Decrypted text
 */
function decrypt(encryptedData, key) {
  const [ivHex, authTagHex, ciphertext] = encryptedData.split(':');

  const keyBuffer = Buffer.from(key, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = {
  hashPassword,
  comparePassword,
  hashToken,
  generateSecureToken,
  generateOTP,
  generateShortId,
  encrypt,
  decrypt,
};
