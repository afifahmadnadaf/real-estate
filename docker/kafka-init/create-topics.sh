#!/bin/bash
# Kafka Topics Creation Script for Real Estate Platform

KAFKA_BROKER="${KAFKA_BROKER:-kafka:29092}"

echo "Waiting for Kafka to be ready..."
sleep 10

echo "Creating Kafka topics..."

# Property Events Topic
kafka-topics --bootstrap-server $KAFKA_BROKER --create --if-not-exists \
  --topic property.events.v1 \
  --partitions 12 \
  --replication-factor 1 \
  --config retention.ms=604800000 \
  --config cleanup.policy=delete

# Media Events Topic
kafka-topics --bootstrap-server $KAFKA_BROKER --create --if-not-exists \
  --topic media.events.v1 \
  --partitions 6 \
  --replication-factor 1 \
  --config retention.ms=259200000 \
  --config cleanup.policy=delete

# Lead Events Topic
kafka-topics --bootstrap-server $KAFKA_BROKER --create --if-not-exists \
  --topic lead.events.v1 \
  --partitions 6 \
  --replication-factor 1 \
  --config retention.ms=604800000 \
  --config cleanup.policy=delete

# Billing Events Topic
kafka-topics --bootstrap-server $KAFKA_BROKER --create --if-not-exists \
  --topic billing.events.v1 \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=2592000000 \
  --config cleanup.policy=delete

# User Events Topic
kafka-topics --bootstrap-server $KAFKA_BROKER --create --if-not-exists \
  --topic user.events.v1 \
  --partitions 6 \
  --replication-factor 1 \
  --config retention.ms=604800000 \
  --config cleanup.policy=delete

# Moderation Events Topic
kafka-topics --bootstrap-server $KAFKA_BROKER --create --if-not-exists \
  --topic moderation.events.v1 \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=604800000 \
  --config cleanup.policy=delete

# Notification Events Topic
kafka-topics --bootstrap-server $KAFKA_BROKER --create --if-not-exists \
  --topic notification.events.v1 \
  --partitions 6 \
  --replication-factor 1 \
  --config retention.ms=259200000 \
  --config cleanup.policy=delete

# Analytics Events Topic
kafka-topics --bootstrap-server $KAFKA_BROKER --create --if-not-exists \
  --topic analytics.events.v1 \
  --partitions 12 \
  --replication-factor 1 \
  --config retention.ms=2592000000 \
  --config cleanup.policy=delete

echo "Listing all topics..."
kafka-topics --bootstrap-server $KAFKA_BROKER --list

echo "Kafka topics created successfully!"

