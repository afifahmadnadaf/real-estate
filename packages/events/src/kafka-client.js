'use strict';

const { Kafka, logLevel } = require('kafkajs');

/**
 * Default Kafka configuration
 */
const defaultConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'real-estate-platform',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  connectionTimeout: 10000,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
};

/**
 * Map log level from environment
 */
function getLogLevel() {
  const level = process.env.KAFKA_LOG_LEVEL || process.env.LOG_LEVEL || 'info';
  const levelMap = {
    error: logLevel.ERROR,
    warn: logLevel.WARN,
    info: logLevel.INFO,
    debug: logLevel.DEBUG,
  };
  return levelMap[level.toLowerCase()] || logLevel.INFO;
}

/**
 * Kafka client wrapper
 */
class KafkaClient {
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
    this.kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.brokers,
      connectionTimeout: this.config.connectionTimeout,
      requestTimeout: this.config.requestTimeout,
      retry: this.config.retry,
      logLevel: getLogLevel(),
      logCreator: this._createLogger.bind(this),
    });

    this.producer = null;
    this.consumers = new Map();
    this.admin = null;
    this.isConnected = false;
  }

  /**
   * Create a pino-compatible logger for Kafka
   */
  _createLogger() {
    return ({ level, log }) => {
      const { message, ...extra } = log;
      const logFn =
        console[level === logLevel.ERROR ? 'error' : level === logLevel.WARN ? 'warn' : 'log'];
      if (logFn) {
        logFn(`[Kafka] ${message}`, Object.keys(extra).length > 0 ? extra : '');
      }
    };
  }

  /**
   * Get or create producer
   * @returns {import('kafkajs').Producer}
   */
  getProducer() {
    if (!this.producer) {
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
        transactionTimeout: 30000,
        idempotent: true,
      });
    }
    return this.producer;
  }

  /**
   * Create a consumer with the specified group ID
   * @param {string} groupId - Consumer group ID
   * @param {Object} [options] - Consumer options
   * @returns {import('kafkajs').Consumer}
   */
  createConsumer(groupId, options = {}) {
    if (this.consumers.has(groupId)) {
      return this.consumers.get(groupId);
    }

    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxBytes: 10485760, // 10MB
      maxWaitTimeInMs: 5000,
      ...options,
    });

    this.consumers.set(groupId, consumer);
    return consumer;
  }

  /**
   * Get admin client
   * @returns {import('kafkajs').Admin}
   */
  getAdmin() {
    if (!this.admin) {
      this.admin = this.kafka.admin();
    }
    return this.admin;
  }

  /**
   * Connect producer
   */
  async connectProducer() {
    const producer = this.getProducer();
    await producer.connect();
    this.isConnected = true;
    console.info('[Kafka] Producer connected');
  }

  /**
   * Disconnect producer
   */
  async disconnectProducer() {
    if (this.producer) {
      await this.producer.disconnect();
      this.producer = null;
      console.info('[Kafka] Producer disconnected');
    }
  }

  /**
   * Disconnect all consumers
   */
  async disconnectConsumers() {
    for (const [groupId, consumer] of this.consumers) {
      await consumer.disconnect();
      console.info(`[Kafka] Consumer ${groupId} disconnected`);
    }
    this.consumers.clear();
  }

  /**
   * Disconnect all connections
   */
  async disconnect() {
    await this.disconnectProducer();
    await this.disconnectConsumers();
    if (this.admin) {
      await this.admin.disconnect();
      this.admin = null;
    }
    this.isConnected = false;
  }

  /**
   * Health check - verify connection
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const admin = this.getAdmin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();
      return true;
    } catch (error) {
      console.error('[Kafka] Health check failed:', error.message);
      return false;
    }
  }
}

/**
 * Create a new Kafka client
 * @param {Object} [config] - Configuration options
 * @returns {KafkaClient}
 */
function createKafkaClient(config = {}) {
  return new KafkaClient(config);
}

// Singleton instance
let defaultClient = null;

/**
 * Get the default Kafka client
 * @returns {KafkaClient}
 */
function getDefaultClient() {
  if (!defaultClient) {
    defaultClient = createKafkaClient();
  }
  return defaultClient;
}

module.exports = {
  KafkaClient,
  createKafkaClient,
  getDefaultClient,
};
