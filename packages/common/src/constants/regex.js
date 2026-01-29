'use strict';

/**
 * Common regular expressions used throughout the application
 */
module.exports = {
  // Email validation (RFC 5322 simplified)
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Indian phone number (with or without +91)
  PHONE_INDIAN: /^(?:\+91|91)?[6-9]\d{9}$/,

  // International phone number
  PHONE_INTERNATIONAL: /^\+?[1-9]\d{6,14}$/,

  // Indian PIN code (6 digits)
  PINCODE: /^[1-9][0-9]{5}$/,

  // URL validation
  URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,

  // Slug validation (lowercase letters, numbers, hyphens)
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,

  // UUID v4
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

  // MongoDB ObjectId
  OBJECT_ID: /^[0-9a-fA-F]{24}$/,

  // PAN Number (India)
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]$/,

  // GST Number (India)
  GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/,

  // RERA Registration Number (generic pattern)
  RERA: /^[A-Z]{2}[A-Z0-9]{2,20}$/,

  // Alphanumeric with spaces
  ALPHANUMERIC_SPACES: /^[a-zA-Z0-9\s]+$/,

  // Only letters and spaces
  LETTERS_SPACES: /^[a-zA-Z\s]+$/,

  // Strong password (min 8 chars, uppercase, lowercase, number, special char)
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,

  // Basic password (min 6 chars)
  PASSWORD_BASIC: /^.{6,}$/,

  // Latitude (-90 to 90)
  LATITUDE: /^-?([1-8]?\d(\.\d+)?|90(\.0+)?)$/,

  // Longitude (-180 to 180)
  LONGITUDE: /^-?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/,

  // Price (positive number, optional decimals)
  PRICE: /^\d+(\.\d{1,2})?$/,

  // Area (positive number, optional decimals)
  AREA: /^\d+(\.\d{1,2})?$/,

  // Year (4 digits, 1900-2099)
  YEAR: /^(19|20)\d{2}$/,

  // Date YYYY-MM-DD
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,

  // Time HH:MM
  TIME_24H: /^([01]\d|2[0-3]):([0-5]\d)$/,

  // IP Address v4
  IP_V4: /^(\d{1,3}\.){3}\d{1,3}$/,

  // JWT Token (3 base64 segments separated by dots)
  JWT: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,

  // HTML tags (for sanitization)
  HTML_TAGS: /<[^>]*>/g,

  // Multiple spaces
  MULTIPLE_SPACES: /\s+/g,

  // Leading/trailing whitespace
  TRIM: /^\s+|\s+$/g,
};
