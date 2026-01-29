'use strict';

const mongoose = require('mongoose');

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
 * MongoDB connection configuration
 */
const defaultConfig = {
  uri: process.env.MONGO_URI || 'mongodb://localhost:27017/real_estate',
  options: {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4
  },
};

let isConnected = false;

/**
 * Connect to MongoDB
 * @param {Object} [config] - Connection configuration
 * @returns {Promise<mongoose.Connection>}
 */
async function connectMongo(config = {}) {
  if (isConnected) {
    logger.info('[MongoDB] Already connected');
    return mongoose.connection;
  }

  const { uri, options } = { ...defaultConfig, ...config };

  try {
    // Set up connection event handlers
    mongoose.connection.on('connected', () => {
      isConnected = true;
      logger.info('[MongoDB] Connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error({ error: err.message }, '[MongoDB] Connection error');
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('[MongoDB] Disconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await disconnectMongo();
      process.exit(0);
    });

    // Connect
    await mongoose.connect(uri, options);

    return mongoose.connection;
  } catch (error) {
    logger.error({ error: error.message }, '[MongoDB] Failed to connect');
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectMongo() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('[MongoDB] Disconnected successfully');
  } catch (error) {
    logger.error({ error: error.message }, '[MongoDB] Error disconnecting');
    throw error;
  }
}

/**
 * Get the current MongoDB connection
 * @returns {mongoose.Connection}
 */
function getMongoConnection() {
  return mongoose.connection;
}

/**
 * Check if MongoDB is connected
 * @returns {boolean}
 */
function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Health check for MongoDB
 * @returns {Promise<boolean>}
 */
async function mongoHealthCheck() {
  try {
    if (!isMongoConnected()) {
      return false;
    }
    await mongoose.connection.db.admin().ping();
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  connectMongo,
  disconnectMongo,
  getMongoConnection,
  isMongoConnected,
  mongoHealthCheck,
  mongoose,
};
