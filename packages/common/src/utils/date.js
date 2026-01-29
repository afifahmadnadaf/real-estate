'use strict';

/**
 * Format a date to ISO string
 * @param {Date|string|number} date - Date to format
 * @returns {string} ISO date string
 */
function formatDate(date) {
  if (!date) {
    return null;
  }
  const d = new Date(date);
  return d.toISOString();
}

/**
 * Parse a date string to Date object
 * @param {string|Date|number} date - Date to parse
 * @returns {Date|null} Date object or null
 */
function parseDate(date) {
  if (!date) {
    return null;
  }
  if (date instanceof Date) {
    return date;
  }
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Check if a date is expired (in the past)
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if expired
 */
function isExpired(date) {
  if (!date) {
    return true;
  }
  const d = new Date(date);
  return d.getTime() < Date.now();
}

/**
 * Check if a date is in the future
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if in future
 */
function isFuture(date) {
  if (!date) {
    return false;
  }
  const d = new Date(date);
  return d.getTime() > Date.now();
}

/**
 * Add days to a date
 * @param {Date|string|number} date - Base date
 * @param {number} days - Days to add
 * @returns {Date} New date
 */
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Add hours to a date
 * @param {Date|string|number} date - Base date
 * @param {number} hours - Hours to add
 * @returns {Date} New date
 */
function addHours(date, hours) {
  const d = new Date(date);
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d;
}

/**
 * Add minutes to a date
 * @param {Date|string|number} date - Base date
 * @param {number} minutes - Minutes to add
 * @returns {Date} New date
 */
function addMinutes(date, minutes) {
  const d = new Date(date);
  d.setTime(d.getTime() + minutes * 60 * 1000);
  return d;
}

/**
 * Get difference between two dates in days
 * @param {Date|string|number} date1 - First date
 * @param {Date|string|number} date2 - Second date
 * @returns {number} Difference in days
 */
function diffInDays(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get start of day
 * @param {Date|string|number} date - Date
 * @returns {Date} Start of day
 */
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day
 * @param {Date|string|number} date - Date
 * @returns {Date} End of day
 */
function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Format date as human-readable relative time
 * @param {Date|string|number} date - Date
 * @returns {string} Relative time string
 */
function timeAgo(date) {
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) {
    return 'just now';
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (seconds < 2592000) {
    const days = Math.floor(seconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (seconds < 31536000) {
    const months = Math.floor(seconds / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  const years = Math.floor(seconds / 31536000);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

module.exports = {
  formatDate,
  parseDate,
  isExpired,
  isFuture,
  addDays,
  addHours,
  addMinutes,
  diffInDays,
  startOfDay,
  endOfDay,
  timeAgo,
};
