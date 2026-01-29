'use strict';

const Redis = require('ioredis');

function formatLogArgs(a, b) {
  if (typeof a === 'string' && b === undefined) return a;
  if (a && typeof a === 'object' && typeof b === 'string') return `${b} ${JSON.stringify(a)}`;
  if (a && typeof a === 'object') return JSON.stringify(a);
  return [a, b].filter(Boolean).join(' ');
}

const logger = {
  info: (a, b) => console.log(formatLogArgs(a, b)),
  warn: (a, b) => console.warn(formatLogArgs(a, b)),
  error: (a, b) => console.error(formatLogArgs(a, b)),
};

/**
 * Redis connection configuration
 */
const defaultConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

let redisClient = null;

/**
 * Connect to Redis
 * @param {Object} [config] - Connection configuration
 * @returns {Promise<Redis>}
 */
async function connectRedis(config = {}) {
  if (redisClient) {
    logger.info('[Redis] Already connected');
    return redisClient;
  }

  const options = { ...defaultConfig, ...config };

  // Filter out undefined values
  Object.keys(options).forEach((key) => options[key] === undefined && delete options[key]);

  try {
    redisClient = new Redis(options);

    redisClient.on('connect', () => {
      logger.info('[Redis] Connected successfully');
    });

    redisClient.on('error', (err) => {
      logger.error({ error: err.message }, '[Redis] Connection error');
    });

    redisClient.on('close', () => {
      logger.warn('[Redis] Connection closed');
    });

    // Wait for connection to be established
    await new Promise((resolve, reject) => {
      redisClient.once('ready', resolve);
      redisClient.once('error', reject);
    });

    return redisClient;
  } catch (error) {
    logger.error({ error: error.message }, '[Redis] Failed to connect');
    throw error;
  }
}

/**
 * Disconnect from Redis
 */
async function disconnectRedis() {
  if (!redisClient) {
    return;
  }

  try {
    await redisClient.quit();
    redisClient = null;
    logger.info('[Redis] Disconnected successfully');
  } catch (error) {
    logger.error({ error: error.message }, '[Redis] Error disconnecting');
    // Force disconnect if quit fails
    redisClient.disconnect();
    redisClient = null;
  }
}

/**
 * Get the current Redis client
 * @returns {Redis}
 */
function getRedisClient() {
  return redisClient;
}

/**
 * Check if Redis is connected
 * @returns {boolean}
 */
function isRedisConnected() {
  return redisClient && redisClient.status === 'ready';
}

module.exports = {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  isRedisConnected,
  redis: new Proxy(
    {},
    {
      get: function (target, prop) {
        if (!redisClient) {
          throw new Error('Redis client not initialized. Call connectRedis() first.');
        }
        return redisClient[prop];
      },
    }
  ),
};
