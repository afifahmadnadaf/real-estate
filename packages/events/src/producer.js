'use strict';

const { v4: uuidv4 } = require('uuid');

const { getDefaultClient } = require('./kafka-client');
const { TOPICS } = require('./types');

/**
 * Event producer for publishing messages to Kafka
 */
class EventProducer {
  /**
   * @param {Object} options - Producer options
   * @param {import('./kafka-client').KafkaClient} [options.client] - Kafka client
   * @param {string} options.service - Service name for event metadata
   */
  constructor(options = {}) {
    this.client = options.client || getDefaultClient();
    this.service = options.service || process.env.SERVICE_NAME || 'unknown';
    this.producer = null;
    this.isConnected = false;
  }

  /**
   * Connect the producer
   */
  async connect() {
    if (this.isConnected) {
      return;
    }
    this.producer = this.client.getProducer();
    await this.producer.connect();
    this.isConnected = true;
  }

  /**
   * Disconnect the producer
   */
  async disconnect() {
    if (this.producer && this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
    }
  }

  /**
   * Create event envelope
   * @param {string} eventType - Event type
   * @param {Object} payload - Event payload
   * @param {Object} [metadata] - Additional metadata
   * @returns {Object} Event envelope
   */
  createEvent(eventType, payload, metadata = {}) {
    return {
      eventId: metadata.eventId || uuidv4(),
      eventType,
      occurredAt: new Date().toISOString(),
      producer: this.service,
      version: metadata.version || 1,
      traceId: metadata.traceId || uuidv4(),
      correlationId: metadata.correlationId,
      payload,
    };
  }

  /**
   * Publish an event to a topic
   * @param {string} topic - Kafka topic
   * @param {string} eventType - Event type
   * @param {Object} payload - Event payload
   * @param {Object} [options] - Publish options
   * @param {string} [options.key] - Message key for partitioning
   * @param {Object} [options.headers] - Message headers
   * @param {Object} [options.metadata] - Event metadata
   * @returns {Promise<Object>} Send result
   */
  async publish(topic, eventType, payload, options = {}) {
    if (!this.isConnected) {
      await this.connect();
    }

    const event = this.createEvent(eventType, payload, options.metadata);

    const message = {
      key: options.key || null,
      value: JSON.stringify(event),
      headers: {
        'event-type': eventType,
        'event-id': event.eventId,
        'trace-id': event.traceId,
        ...options.headers,
      },
    };

    const result = await this.producer.send({
      topic,
      messages: [message],
    });

    return {
      eventId: event.eventId,
      topic,
      partition: result[0]?.partition,
      offset: result[0]?.offset,
    };
  }

  /**
   * Publish multiple events in a batch
   * @param {string} topic - Kafka topic
   * @param {Array<{eventType: string, payload: Object, key?: string}>} events - Events to publish
   * @param {Object} [options] - Publish options
   * @returns {Promise<Object>} Send results
   */
  async publishBatch(topic, events, options = {}) {
    if (!this.isConnected) {
      await this.connect();
    }

    const messages = events.map((e) => {
      const event = this.createEvent(e.eventType, e.payload, options.metadata);
      return {
        key: e.key || null,
        value: JSON.stringify(event),
        headers: {
          'event-type': e.eventType,
          'event-id': event.eventId,
          'trace-id': event.traceId,
        },
      };
    });

    const result = await this.producer.send({
      topic,
      messages,
    });

    return result;
  }

  // Convenience methods for each domain

  /**
   * Publish property event
   */
  async publishPropertyEvent(eventType, payload, options = {}) {
    return this.publish(TOPICS.PROPERTY, eventType, payload, {
      key: payload.propertyId || payload.id,
      ...options,
    });
  }

  /**
   * Publish media event
   */
  async publishMediaEvent(eventType, payload, options = {}) {
    return this.publish(TOPICS.MEDIA, eventType, payload, {
      key: payload.mediaId || payload.id,
      ...options,
    });
  }

  /**
   * Publish lead event
   */
  async publishLeadEvent(eventType, payload, options = {}) {
    return this.publish(TOPICS.LEAD, eventType, payload, {
      key: payload.leadId || payload.id,
      ...options,
    });
  }

  /**
   * Publish billing event
   */
  async publishBillingEvent(eventType, payload, options = {}) {
    return this.publish(TOPICS.BILLING, eventType, payload, {
      key: payload.userId || payload.subscriptionId || payload.paymentId,
      ...options,
    });
  }

  /**
   * Publish user event
   */
  async publishUserEvent(eventType, payload, options = {}) {
    return this.publish(TOPICS.USER, eventType, payload, {
      key: payload.userId || payload.id,
      ...options,
    });
  }

  /**
   * Publish moderation event
   */
  async publishModerationEvent(eventType, payload, options = {}) {
    return this.publish(TOPICS.MODERATION, eventType, payload, {
      key: payload.taskId || payload.entityId,
      ...options,
    });
  }

  /**
   * Publish notification event
   */
  async publishNotificationEvent(eventType, payload, options = {}) {
    return this.publish(TOPICS.NOTIFICATION, eventType, payload, {
      key: payload.userId || payload.notificationId,
      ...options,
    });
  }
}

/**
 * Create a new event producer
 * @param {Object} [options] - Producer options
 * @returns {EventProducer}
 */
function createProducer(options = {}) {
  return new EventProducer(options);
}

module.exports = {
  EventProducer,
  createProducer,
};
