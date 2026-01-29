/* eslint-disable no-undef */
// MongoDB Initialization Script
// Creates database, collections, and indexes for the Real Estate Platform

// Switch to the real_estate database
db = db.getSiblingDB('real_estate');

// Create collections with validators
print('Creating collections...');

// Properties Collection
db.createCollection('properties', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['type', 'status', 'owner', 'title', 'location', 'createdAt', 'updatedAt'],
      properties: {
        type: {
          enum: ['RENT', 'RESALE', 'PROJECT', 'PROJECT_UNIT'],
          description: 'Type of property listing',
        },
        status: {
          enum: [
            'DRAFT',
            'SUBMITTED',
            'UNDER_REVIEW',
            'PUBLISHED',
            'REJECTED',
            'EXPIRED',
            'ARCHIVED',
          ],
          description: 'Current status of the listing',
        },
      },
    },
  },
});

// Projects Collection
db.createCollection('projects', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['orgId', 'name', 'status', 'createdAt', 'updatedAt'],
      properties: {
        status: {
          enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PUBLISHED', 'ARCHIVED'],
          description: 'Current status of the project',
        },
      },
    },
  },
});

// Media Collection
db.createCollection('media');

// Property Versions Collection (for audit trail)
db.createCollection('property_versions');

print('Creating indexes...');

// Properties Indexes
db.properties.createIndex({ status: 1, 'location.cityId': 1, 'location.localityId': 1 });
db.properties.createIndex({ 'location.geo': '2dsphere' });
db.properties.createIndex({ 'owner.userId': 1, status: 1 });
db.properties.createIndex({ 'owner.orgId': 1, status: 1 });
db.properties.createIndex({ 'premium.tier': 1, 'premium.activeUntil': 1 });
db.properties.createIndex({ type: 1, status: 1, 'attributes.propertyType': 1 });
db.properties.createIndex({ slug: 1 }, { unique: true, sparse: true });
db.properties.createIndex({ updatedAt: -1 });
db.properties.createIndex({ expiresAt: 1 });
db.properties.createIndex({ createdAt: -1 });

// Projects Indexes
db.projects.createIndex({ orgId: 1, status: 1 });
db.projects.createIndex({ slug: 1 }, { unique: true, sparse: true });
db.projects.createIndex({ 'location.cityId': 1 });
db.projects.createIndex({ 'location.geo': '2dsphere' });
db.projects.createIndex({ status: 1, createdAt: -1 });

// Media Indexes
db.media.createIndex({ userId: 1, createdAt: -1 });
db.media.createIndex({ orgId: 1, createdAt: -1 });
db.media.createIndex({ status: 1 });
db.media.createIndex({ 'usages.entityType': 1, 'usages.entityId': 1 });

// Property Versions Indexes
db.property_versions.createIndex({ propertyId: 1, version: -1 });
db.property_versions.createIndex({ propertyId: 1, createdAt: -1 });

print('MongoDB initialization completed successfully!');
print('Collections created: properties, projects, media, property_versions');
