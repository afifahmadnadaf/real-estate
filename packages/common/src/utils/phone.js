'use strict';

/**
 * Indian phone number regex (with or without +91)
 */
const INDIAN_PHONE_REGEX = /^(?:\+91|91)?[6-9]\d{9}$/;

/**
 * General phone number regex (international format)
 */
const INTERNATIONAL_PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

/**
 * Format a phone number to standard format (+91XXXXXXXXXX for India)
 * @param {string} phone - Phone number
 * @param {string} [countryCode=91] - Country code
 * @returns {string} Formatted phone number
 */
function formatPhone(phone, countryCode = '91') {
  if (!phone) {
    return '';
  }

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Remove country code if present
  if (cleaned.startsWith(countryCode)) {
    cleaned = cleaned.slice(countryCode.length);
  }

  // Add country code
  return `+${countryCode}${cleaned}`;
}

/**
 * Validate an Indian phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
function validatePhone(phone) {
  if (!phone) {
    return false;
  }

  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  return INDIAN_PHONE_REGEX.test(cleaned);
}

/**
 * Validate an international phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
function validateInternationalPhone(phone) {
  if (!phone) {
    return false;
  }

  const cleaned = phone.replace(/[^\d+]/g, '');
  return INTERNATIONAL_PHONE_REGEX.test(cleaned);
}

/**
 * Mask a phone number for privacy (show last 4 digits)
 * @param {string} phone - Phone number
 * @param {number} [visibleDigits=4] - Number of visible digits at end
 * @returns {string} Masked phone number
 */
function maskPhone(phone, visibleDigits = 4) {
  if (!phone) {
    return '';
  }

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length <= visibleDigits) {
    return phone;
  }

  const visible = cleaned.slice(-visibleDigits);
  const masked = '*'.repeat(cleaned.length - visibleDigits);

  return `${masked}${visible}`;
}

/**
 * Extract country code from phone number
 * @param {string} phone - Phone number with country code
 * @returns {Object} { countryCode, number }
 */
function parsePhoneNumber(phone) {
  if (!phone) {
    return { countryCode: null, number: null };
  }

  const cleaned = phone.replace(/[^\d+]/g, '');

  // Handle + prefix
  if (cleaned.startsWith('+')) {
    // Common country codes
    if (cleaned.startsWith('+91') && cleaned.length === 13) {
      return { countryCode: '91', number: cleaned.slice(3) };
    }
    if (cleaned.startsWith('+1') && cleaned.length === 12) {
      return { countryCode: '1', number: cleaned.slice(2) };
    }
    if (cleaned.startsWith('+44') && cleaned.length >= 12) {
      return { countryCode: '44', number: cleaned.slice(3) };
    }
    // Default: assume first 2 digits are country code
    return { countryCode: cleaned.slice(1, 3), number: cleaned.slice(3) };
  }

  // No + prefix - assume Indian number
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return { countryCode: '91', number: cleaned.slice(2) };
  }

  // Just the number
  return { countryCode: null, number: cleaned };
}

/**
 * Get display format for phone number
 * @param {string} phone - Phone number
 * @returns {string} Display formatted number (e.g., +91 98765 43210)
 */
function getDisplayFormat(phone) {
  const formatted = formatPhone(phone);

  if (formatted.startsWith('+91') && formatted.length === 13) {
    const number = formatted.slice(3);
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
  }

  return formatted;
}

module.exports = {
  formatPhone,
  validatePhone,
  validateInternationalPhone,
  maskPhone,
  parsePhoneNumber,
  getDisplayFormat,
  INDIAN_PHONE_REGEX,
  INTERNATIONAL_PHONE_REGEX,
};
