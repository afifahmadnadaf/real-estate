'use strict';

/**
 * Default pagination settings
 */
const DEFAULTS = {
  limit: 20,
  maxLimit: 100,
};

/**
 * Cursor-based pagination utilities
 * Cursors are base64 encoded JSON with { id, createdAt } or custom fields
 */

/**
 * Encode a cursor from data
 * @param {Object} data - Cursor data
 * @returns {string} Base64 encoded cursor
 */
function encodeCursor(data) {
  if (!data) {
    return null;
  }
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

/**
 * Decode a cursor to data
 * @param {string} cursor - Base64 encoded cursor
 * @returns {Object|null} Decoded cursor data
 */
function decodeCursor(cursor) {
  if (!cursor) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Create a cursor from an item
 * @param {Object} item - Item to create cursor from
 * @param {string[]} [fields=['_id', 'createdAt']] - Fields to include in cursor
 * @returns {string} Encoded cursor
 */
function createCursor(item, fields = ['_id', 'createdAt']) {
  if (!item) {
    return null;
  }

  const cursorData = {};
  for (const field of fields) {
    if (item[field] !== undefined) {
      // Handle ObjectId and Date
      const value = item[field];
      if (value && typeof value.toISOString === 'function') {
        cursorData[field] = value.toISOString();
      } else if (value && typeof value.toString === 'function' && value._bsontype === 'ObjectId') {
        cursorData[field] = value.toString();
      } else {
        cursorData[field] = value;
      }
    }
  }

  return encodeCursor(cursorData);
}

/**
 * Parse cursor from request
 * @param {string} cursor - Cursor string from request
 * @returns {Object|null} Parsed cursor data
 */
function parseCursor(cursor) {
  return decodeCursor(cursor);
}

/**
 * Build pagination response
 * @param {Object} params - Parameters
 * @param {Array} params.items - Items array
 * @param {number} params.limit - Page limit
 * @param {string[]} [params.cursorFields] - Fields for cursor
 * @param {number} [params.total] - Total count (optional)
 * @returns {Object} Pagination response
 */
function paginate({ items, limit, cursorFields = ['_id', 'createdAt'], total = null }) {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;

  const response = {
    data,
    pagination: {
      hasMore,
      nextCursor: hasMore ? createCursor(data[data.length - 1], cursorFields) : null,
      count: data.length,
    },
  };

  if (total !== null) {
    response.pagination.total = total;
  }

  return response;
}

/**
 * Parse pagination params from request query
 * @param {Object} query - Request query object
 * @param {Object} [options] - Options
 * @param {number} [options.defaultLimit] - Default limit
 * @param {number} [options.maxLimit] - Maximum limit
 * @returns {Object} { limit, cursor, skip, page }
 */
function parsePaginationParams(query, options = {}) {
  const { defaultLimit = DEFAULTS.limit, maxLimit = DEFAULTS.maxLimit } = options;

  let limit = parseInt(query.limit, 10) || defaultLimit;
  limit = Math.min(Math.max(1, limit), maxLimit);

  const cursor = query.cursor || null;
  const cursorData = parseCursor(cursor);

  // Support offset-based pagination as fallback
  const page = parseInt(query.page, 10) || 1;
  const skip = (page - 1) * limit;

  return {
    limit,
    cursor,
    cursorData,
    skip,
    page,
  };
}

/**
 * Build MongoDB query from cursor
 * @param {Object} cursorData - Decoded cursor data
 * @param {string} [sortField='createdAt'] - Sort field
 * @param {number} [sortOrder=-1] - Sort order (1 or -1)
 * @returns {Object} MongoDB query filter
 */
function buildCursorQuery(cursorData, sortField = 'createdAt', sortOrder = -1) {
  if (!cursorData || !cursorData[sortField]) {
    return {};
  }

  const operator = sortOrder === -1 ? '$lt' : '$gt';
  return {
    [sortField]: { [operator]: cursorData[sortField] },
  };
}

module.exports = {
  encodeCursor,
  decodeCursor,
  createCursor,
  parseCursor,
  paginate,
  parsePaginationParams,
  buildCursorQuery,
  DEFAULTS,
};
