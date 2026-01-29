'use strict';

const { nanoid } = require('nanoid');
const slugify = require('slugify');

/**
 * Default slugify options
 */
const defaultOptions = {
  lower: true,
  strict: true,
  trim: true,
  locale: 'en',
};

/**
 * Generate a URL-friendly slug from text
 * @param {string} text - Text to slugify
 * @param {Object} [options] - Slugify options
 * @returns {string} URL-friendly slug
 */
function generateSlug(text, options = {}) {
  if (!text) {
    return '';
  }

  return slugify(text, {
    ...defaultOptions,
    ...options,
  });
}

/**
 * Generate a unique slug by appending a random suffix
 * @param {string} text - Text to slugify
 * @param {number} [suffixLength=6] - Length of random suffix
 * @param {Object} [options] - Slugify options
 * @returns {string} Unique slug
 */
function generateUniqueSlug(text, suffixLength = 6, options = {}) {
  const baseSlug = generateSlug(text, options);
  const suffix = nanoid(suffixLength).toLowerCase();
  return `${baseSlug}-${suffix}`;
}

/**
 * Generate a property slug with location context
 * @param {Object} params - Parameters
 * @param {string} params.title - Property title
 * @param {string} [params.locality] - Locality name
 * @param {string} [params.city] - City name
 * @param {string} [params.type] - Property type (rent/sale)
 * @returns {string} Property slug
 */
function generatePropertySlug({ title, locality, city, type }) {
  const parts = [];

  if (type) {
    parts.push(type.toLowerCase());
  }

  if (title) {
    parts.push(generateSlug(title));
  }

  if (locality) {
    parts.push(generateSlug(locality));
  }

  if (city) {
    parts.push(generateSlug(city));
  }

  // Add unique suffix
  parts.push(nanoid(8).toLowerCase());

  return parts.filter(Boolean).join('-');
}

/**
 * Generate a project slug
 * @param {Object} params - Parameters
 * @param {string} params.name - Project name
 * @param {string} [params.builder] - Builder name
 * @param {string} [params.city] - City name
 * @returns {string} Project slug
 */
function generateProjectSlug({ name, builder, city }) {
  const parts = [];

  if (name) {
    parts.push(generateSlug(name));
  }

  if (builder) {
    parts.push(generateSlug(builder));
  }

  if (city) {
    parts.push(generateSlug(city));
  }

  // Add unique suffix
  parts.push(nanoid(6).toLowerCase());

  return parts.filter(Boolean).join('-');
}

/**
 * Validate if a string is a valid slug
 * @param {string} slug - Slug to validate
 * @returns {boolean} True if valid
 */
function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return false;
  }
  // Slug should only contain lowercase letters, numbers, and hyphens
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

module.exports = {
  generateSlug,
  generateUniqueSlug,
  generatePropertySlug,
  generateProjectSlug,
  isValidSlug,
};
