'use strict';

const { Client } = require('@elastic/elasticsearch');

const config = require('../config');

let esClient = null;

/**
 * Get Elasticsearch client (singleton)
 */
function getElasticsearchClient() {
  if (!esClient) {
    esClient = new Client({
      node: config.elasticsearch.node,
      auth: config.elasticsearch.auth,
      tls: config.elasticsearch.tls,
    });
  }
  return esClient;
}

/**
 * Create index if it doesn't exist
 */
async function ensureIndex() {
  const client = getElasticsearchClient();
  const indexName = config.search.indexName;

  const exists = await client.indices.exists({ index: indexName });

  if (!exists) {
    await client.indices.create({
      index: indexName,
      body: {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            type: { type: 'keyword' },
            status: { type: 'keyword' },
            title: {
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' },
                autocomplete: {
                  type: 'text',
                  analyzer: 'autocomplete',
                },
              },
            },
            description: { type: 'text' },
            owner: {
              properties: {
                userId: { type: 'keyword' },
                orgId: { type: 'keyword' },
                type: { type: 'keyword' },
              },
            },
            pricing: {
              properties: {
                amount: { type: 'long' },
                pricePerSqft: { type: 'integer' },
                maintenanceCharges: { type: 'integer' },
                currency: { type: 'keyword' },
              },
            },
            attributes: {
              properties: {
                propertyType: { type: 'keyword' },
                subType: { type: 'keyword' },
                bedrooms: { type: 'integer' },
                bathrooms: { type: 'integer' },
                carpetArea: { type: 'integer' },
                builtUpArea: { type: 'integer' },
                facing: { type: 'keyword' },
                furnishing: { type: 'keyword' },
                possessionStatus: { type: 'keyword' },
                amenities: { type: 'keyword' },
                ageOfProperty: { type: 'integer' },
              },
            },
            location: {
              properties: {
                locality: { type: 'keyword' },
                localityId: { type: 'keyword' },
                city: { type: 'keyword' },
                cityId: { type: 'keyword' },
                state: { type: 'keyword' },
                pincode: { type: 'keyword' },
                geo: { type: 'geo_point' },
              },
            },
            media: {
              properties: {
                primaryImage: { type: 'keyword' },
                imageCount: { type: 'integer' },
                hasVideo: { type: 'boolean' },
                hasVirtualTour: { type: 'boolean' },
              },
            },
            premium: {
              properties: {
                tier: { type: 'keyword' },
                activeUntil: { type: 'date' },
                isActive: { type: 'boolean' },
              },
            },
            metrics: {
              properties: {
                views: { type: 'integer' },
                shortlists: { type: 'integer' },
                inquiries: { type: 'integer' },
              },
            },
            qualityScore: { type: 'float' },
            publishedAt: { type: 'date' },
            updatedAt: { type: 'date' },
          },
        },
        settings: {
          analysis: {
            analyzer: {
              autocomplete: {
                type: 'custom',
                tokenizer: 'autocomplete',
                filter: ['lowercase'],
              },
            },
            tokenizer: {
              autocomplete: {
                type: 'edge_ngram',
                min_gram: 2,
                max_gram: 20,
                token_chars: ['letter', 'digit'],
              },
            },
          },
        },
      },
    });
  }

  return indexName;
}

/**
 * Index a property
 */
async function indexProperty(property) {
  const client = getElasticsearchClient();
  const indexName = await ensureIndex();

  const doc = {
    id: property._id.toString(),
    type: property.type,
    status: property.status,
    title: property.title,
    description: property.description || '',
    owner: property.owner,
    pricing: property.pricing,
    attributes: property.attributes,
    location: {
      ...property.location,
      geo: property.location?.geo?.coordinates
        ? {
            lat: property.location.geo.coordinates[1],
            lon: property.location.geo.coordinates[0],
          }
        : null,
    },
    media: {
      primaryImage: property.media?.images?.[0]?.url || null,
      imageCount: property.media?.images?.length || 0,
      hasVideo: (property.media?.videos?.length || 0) > 0,
      hasVirtualTour: !!property.media?.virtualTour,
    },
    premium: {
      tier: property.premium?.tier || 'NONE',
      activeUntil: property.premium?.activeUntil || null,
      isActive:
        property.premium?.tier !== 'NONE' &&
        (!property.premium?.activeUntil || new Date(property.premium.activeUntil) > new Date()),
    },
    metrics: property.metrics || {
      views: 0,
      shortlists: 0,
      inquiries: 0,
    },
    qualityScore: property.moderation?.qualityScore || property.moderation?.autoScore || 0,
    publishedAt: property.publishedAt || null,
    updatedAt: property.updatedAt || property.createdAt,
  };

  await client.index({
    index: indexName,
    id: property._id.toString(),
    body: doc,
  });
}

/**
 * Delete property from index
 */
async function deleteProperty(propertyId) {
  const client = getElasticsearchClient();
  const indexName = config.search.indexName;

  try {
    await client.delete({
      index: indexName,
      id: propertyId,
    });
  } catch (error) {
    if (error.meta?.statusCode !== 404) {
      throw error;
    }
  }
}

/**
 * Update property in index
 */
async function updateProperty(property) {
  await indexProperty(property);
}

module.exports = {
  getElasticsearchClient,
  ensureIndex,
  indexProperty,
  deleteProperty,
  updateProperty,
};
