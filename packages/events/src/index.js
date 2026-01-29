'use strict';

/**
 * @real-estate/events
 * Kafka event handling for the Real Estate Platform
 */

const { EventConsumer, createConsumer } = require('./consumer');
const { KafkaClient, createKafkaClient } = require('./kafka-client');
const { EventProducer, createProducer } = require('./producer');
const baseSchema = require('./schemas/base.schema');
const billingSchema = require('./schemas/billing.schema');
const leadSchema = require('./schemas/lead.schema');
const mediaSchema = require('./schemas/media.schema');
const moderationSchema = require('./schemas/moderation.schema');
const notificationSchema = require('./schemas/notification.schema');
const propertySchema = require('./schemas/property.schema');
const userSchema = require('./schemas/user.schema');
const eventTypes = require('./types');

module.exports = {
  // Client
  KafkaClient,
  createKafkaClient,

  // Producer
  EventProducer,
  createProducer,

  // Consumer
  EventConsumer,
  createConsumer,

  // Types
  eventTypes,
  TOPICS: eventTypes.TOPICS,
  EVENT_TYPES: eventTypes.EVENT_TYPES,

  // Schemas
  schemas: {
    base: baseSchema,
    property: propertySchema,
    media: mediaSchema,
    lead: leadSchema,
    billing: billingSchema,
    user: userSchema,
    moderation: moderationSchema,
    notification: notificationSchema,
  },
};
