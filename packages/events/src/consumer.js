'use strict';

const { getDefaultClient } = require('./kafka-client');

/**
 * Event consumer for subscribing to Kafka topics
 */
class EventConsumer {
  /**
   * @param {Object} options - Consumer options
   * @param {import('./kafka-client').KafkaClient} [options.client] - Kafka client
   * @param {string} options.groupId - Consumer group ID
   * @param {string} options.service - Service name
   */
  constructor(options = {}) {
    this.client = options.client || getDefaultClient();
    this.groupId = options.groupId;
    this.service = options.service || process.env.SERVICE_NAME || 'unknown';
    this.consumer = null;
    this.isConnected = false;
    this.handlers = new Map();
    this.processedEvents = new Set(); // For idempotency (in production, use Redis)
  }

  /**
   * Connect the consumer
   */
  async connect() {
    if (this.isConnected) {
      return;
    }
    this.consumer = this.client.createConsumer(this.groupId);
    await this.consumer.connect();
    this.isConnected = true;
    console.info(`[Kafka] Consumer ${this.groupId} connected`);
  }

  /**
   * Disconnect the consumer
   */
  async disconnect() {
    if (this.consumer && this.isConnected) {
      await this.consumer.disconnect();
      this.isConnected = false;
      console.info(`[Kafka] Consumer ${this.groupId} disconnected`);
    }
  }

  /**
   * Subscribe to topics
   * @param {string|string[]} topics - Topic(s) to subscribe to
   * @param {Object} [options] - Subscribe options
   */
  async subscribe(topics, options = {}) {
    if (!this.isConnected) {
      await this.connect();
    }

    const topicList = Array.isArray(topics) ? topics : [topics];

    for (const topic of topicList) {
      await this.consumer.subscribe({
        topic,
        fromBeginning: options.fromBeginning || false,
      });
      console.info(`[Kafka] Subscribed to topic: ${topic}`);
    }
  }

  /**
   * Register event handler
   * @param {string} eventType - Event type to handle
   * @param {Function} handler - Handler function (async (event, context) => void)
   */
  on(eventType, handler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType).push(handler);
  }

  /**
   * Register handler for all events
   * @param {Function} handler - Handler function
   */
  onAll(handler) {
    this.on('*', handler);
  }

  /**
   * Start consuming messages
   * @param {Object} [options] - Run options
   */
  async run(options = {}) {
    if (!this.isConnected) {
      await this.connect();
    }

    await this.consumer.run({
      autoCommit: options.autoCommit !== false,
      autoCommitInterval: options.autoCommitInterval || 5000,
      eachMessage: async ({ topic, partition, message }) => {
        try {
          await this._handleMessage(topic, partition, message);
        } catch (error) {
          console.error('[Kafka] Message processing error:', error);
          // In production, implement DLQ logic here
        }
      },
    });

    console.info(`[Kafka] Consumer ${this.groupId} running`);
  }

  /**
   * Handle incoming message
   * @private
   */
  async _handleMessage(topic, partition, message) {
    const eventData = JSON.parse(message.value.toString());
    const { eventId, eventType, payload, traceId, occurredAt } = eventData;

    // Idempotency check
    if (this.processedEvents.has(eventId)) {
      console.info(`[Kafka] Skipping duplicate event: ${eventId}`);
      return;
    }

    // Context for handlers
    const context = {
      topic,
      partition,
      offset: message.offset,
      timestamp: message.timestamp,
      headers: this._parseHeaders(message.headers),
      eventId,
      traceId,
      occurredAt,
    };

    // Get handlers for this event type
    const handlers = [...(this.handlers.get(eventType) || []), ...(this.handlers.get('*') || [])];

    if (handlers.length === 0) {
      console.warn(`[Kafka] No handler for event type: ${eventType}`);
      return;
    }

    // Execute handlers
    for (const handler of handlers) {
      await handler(payload, context, eventData);
    }

    // Mark as processed (with TTL cleanup in production)
    this.processedEvents.add(eventId);

    // Cleanup old event IDs (keep last 10000)
    if (this.processedEvents.size > 10000) {
      const iterator = this.processedEvents.values();
      this.processedEvents.delete(iterator.next().value);
    }
  }

  /**
   * Parse message headers
   * @private
   */
  _parseHeaders(headers) {
    if (!headers) {
      return {};
    }
    const parsed = {};
    for (const [key, value] of Object.entries(headers)) {
      parsed[key] = value?.toString();
    }
    return parsed;
  }

  /**
   * Pause consumption
   * @param {string|string[]} topics - Topic(s) to pause
   */
  pause(topics) {
    const topicList = Array.isArray(topics) ? topics : [topics];
    this.consumer.pause(topicList.map((topic) => ({ topic })));
    console.info(`[Kafka] Paused topics: ${topicList.join(', ')}`);
  }

  /**
   * Resume consumption
   * @param {string|string[]} topics - Topic(s) to resume
   */
  resume(topics) {
    const topicList = Array.isArray(topics) ? topics : [topics];
    this.consumer.resume(topicList.map((topic) => ({ topic })));
    console.info(`[Kafka] Resumed topics: ${topicList.join(', ')}`);
  }
}

/**
 * Create a new event consumer
 * @param {Object} options - Consumer options
 * @returns {EventConsumer}
 */
function createConsumer(options = {}) {
  return new EventConsumer(options);
}

module.exports = {
  EventConsumer,
  createConsumer,
};
