'use strict';

const config = require('../config');

const { getElasticsearchClient } = require('./elasticsearch.service');

/**
 * Build search query
 */
function buildSearchQuery(params) {
  const {
    q,
    type,
    cityId,
    localityId,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    propertyType,
    furnishing,
    possessionStatus,
    amenities,
    lat,
    lng,
    radius,
    sortBy,
    sortOrder,
  } = params;

  const must = [];
  const should = [];
  const filters = [];

  // Status filter - only published properties
  filters.push({ term: { status: 'PUBLISHED' } });

  // Type filter
  if (type) {
    filters.push({ term: { type } });
  }

  // Location filters
  if (cityId) {
    filters.push({ term: { 'location.cityId': cityId } });
  }
  if (localityId) {
    filters.push({ term: { 'location.localityId': localityId } });
  }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceRange = {};
    if (minPrice !== undefined) {
      priceRange.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      priceRange.lte = maxPrice;
    }
    filters.push({ range: { 'pricing.amount': priceRange } });
  }

  // Attributes filters
  if (bedrooms !== undefined) {
    filters.push({ term: { 'attributes.bedrooms': bedrooms } });
  }
  if (bathrooms !== undefined) {
    filters.push({ term: { 'attributes.bathrooms': bathrooms } });
  }
  if (propertyType) {
    filters.push({ term: { 'attributes.propertyType': propertyType } });
  }
  if (furnishing) {
    filters.push({ term: { 'attributes.furnishing': furnishing } });
  }
  if (possessionStatus) {
    filters.push({ term: { 'attributes.possessionStatus': possessionStatus } });
  }
  if (amenities && amenities.length > 0) {
    filters.push({ terms: { 'attributes.amenities': amenities } });
  }

  // Text search
  if (q) {
    should.push({
      multi_match: {
        query: q,
        fields: ['title^3', 'description', 'location.locality', 'location.city'],
        type: 'best_fields',
        fuzziness: 'AUTO',
      },
    });
    should.push({
      match: {
        'title.autocomplete': {
          query: q,
          boost: 2,
        },
      },
    });
  }

  // Geo search
  if (lat && lng && radius) {
    filters.push({
      geo_distance: {
        distance: `${radius}km`,
        'location.geo': {
          lat: parseFloat(lat),
          lon: parseFloat(lng),
        },
      },
    });
  }

  // Build query
  const query = {
    bool: {
      must: must.length > 0 ? must : undefined,
      should: should.length > 0 ? should : undefined,
      filter: filters.length > 0 ? filters : undefined,
      minimum_should_match: should.length > 0 ? 1 : undefined,
    },
  };

  // Build sort
  const sort = [];
  if (sortBy === 'price') {
    sort.push({ 'pricing.amount': { order: sortOrder || 'asc' } });
  } else if (sortBy === 'relevance' || q) {
    sort.push({ _score: { order: 'desc' } });
  } else if (sortBy === 'newest') {
    sort.push({ publishedAt: { order: 'desc' } });
  } else {
    // Default: boost premium listings, then by published date
    sort.push({ 'premium.isActive': { order: 'desc' } });
    sort.push({ 'premium.tier': { order: 'desc' } });
    sort.push({ publishedAt: { order: 'desc' } });
  }

  return { query, sort };
}

/**
 * Search properties
 */
async function searchProperties(params) {
  const client = getElasticsearchClient();
  const indexName = config.search.indexName;

  const { query, sort } = buildSearchQuery(params);
  const limit = Math.min(params.limit || config.search.defaultLimit, config.search.maxLimit);
  const offset = params.offset || 0;

  const response = await client.search({
    index: indexName,
    body: {
      query,
      sort,
      from: offset,
      size: limit,
      _source: [
        'id',
        'type',
        'title',
        'pricing',
        'attributes',
        'location',
        'media',
        'premium',
        'publishedAt',
      ],
    },
  });

  const properties = response.body.hits.hits.map((hit) => ({
    ...hit._source,
    score: hit._score,
  }));

  return {
    properties,
    total: response.body.hits.total.value,
    limit,
    offset,
  };
}

/**
 * Map/geo search
 */
async function mapSearch(params) {
  const { bounds, zoom: _zoom } = params;
  const client = getElasticsearchClient();
  const indexName = config.search.indexName;

  const filters = [{ term: { status: 'PUBLISHED' } }];

  if (bounds) {
    filters.push({
      geo_bounding_box: {
        'location.geo': {
          top_left: {
            lat: bounds.north,
            lon: bounds.west,
          },
          bottom_right: {
            lat: bounds.south,
            lon: bounds.east,
          },
        },
      },
    });
  }

  const response = await client.search({
    index: indexName,
    body: {
      query: {
        bool: {
          filter: filters,
        },
      },
      size: 1000, // Map view can show more results
      _source: ['id', 'title', 'pricing', 'location', 'media', 'premium'],
    },
  });

  return response.body.hits.hits.map((hit) => hit._source);
}

/**
 * Autocomplete/suggest
 */
async function autocomplete(query, limit = 10) {
  const client = getElasticsearchClient();
  const indexName = config.search.indexName;

  const response = await client.search({
    index: indexName,
    body: {
      query: {
        bool: {
          must: [
            { term: { status: 'PUBLISHED' } },
            {
              match: {
                'title.autocomplete': {
                  query,
                  operator: 'and',
                },
              },
            },
          ],
        },
      },
      size: limit,
      _source: ['id', 'title', 'location', 'pricing'],
    },
  });

  return response.body.hits.hits.map((hit) => ({
    id: hit._source.id,
    title: hit._source.title,
    location: hit._source.location,
    pricing: hit._source.pricing,
  }));
}

/**
 * Get filter metadata (facets)
 */
async function getFilterMetadata(cityId = null) {
  const client = getElasticsearchClient();
  const indexName = config.search.indexName;

  const filters = [{ term: { status: 'PUBLISHED' } }];
  if (cityId) {
    filters.push({ term: { 'location.cityId': cityId } });
  }

  const response = await client.search({
    index: indexName,
    body: {
      query: {
        bool: {
          filter: filters,
        },
      },
      size: 0,
      aggs: {
        propertyTypes: {
          terms: { field: 'attributes.propertyType', size: 20 },
        },
        bedrooms: {
          terms: { field: 'attributes.bedrooms', size: 10 },
        },
        priceRange: {
          stats: { field: 'pricing.amount' },
        },
        localities: {
          terms: { field: 'location.localityId', size: 50 },
        },
        furnishing: {
          terms: { field: 'attributes.furnishing', size: 5 },
        },
      },
    },
  });

  return {
    propertyTypes: response.body.aggregations.propertyTypes.buckets.map((b) => ({
      value: b.key,
      count: b.doc_count,
    })),
    bedrooms: response.body.aggregations.bedrooms.buckets.map((b) => ({
      value: b.key,
      count: b.doc_count,
    })),
    priceRange: {
      min: response.body.aggregations.priceRange.min,
      max: response.body.aggregations.priceRange.max,
    },
    localities: response.body.aggregations.localities.buckets.map((b) => ({
      localityId: b.key,
      count: b.doc_count,
    })),
    furnishing: response.body.aggregations.furnishing.buckets.map((b) => ({
      value: b.key,
      count: b.doc_count,
    })),
  };
}

/**
 * Trigger reindex (admin)
 */
async function triggerReindex() {
  const { nanoid } = require('nanoid');
  const taskId = nanoid();

  // Store task status (in production, use Redis or database)
  // For now, return taskId and mark as completed immediately
  // In production, this would trigger a background job

  return taskId;
}

/**
 * Get reindex status (admin)
 */
async function getReindexStatus(taskId) {
  // In production, fetch from Redis or database
  // For now, return a mock status
  return {
    taskId,
    status: 'completed',
    progress: 100,
    totalDocuments: 0,
    indexedDocuments: 0,
    errors: [],
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
}

/**
 * Get index health (admin)
 */
async function getIndexHealth() {
  const client = getElasticsearchClient();
  const indexName = require('../config').search.indexName;

  try {
    const stats = await client.indices.stats({ index: indexName });
    const health = await client.cluster.health({ index: indexName });

    return {
      index: indexName,
      status: health.body.status,
      documentCount: stats.body.indices[indexName]?.total?.docs?.count || 0,
      size: stats.body.indices[indexName]?.total?.store?.size_in_bytes || 0,
      health: {
        status: health.body.status,
        numberOfNodes: health.body.number_of_nodes,
        numberOfDataNodes: health.body.number_of_data_nodes,
        activePrimaryShards: health.body.active_primary_shards,
        activeShards: health.body.active_shards,
        relocatingShards: health.body.relocating_shards,
        initializingShards: health.body.initializing_shards,
        unassignedShards: health.body.unassigned_shards,
      },
    };
  } catch (error) {
    throw new Error(`Failed to get index health: ${error.message}`);
  }
}

module.exports = {
  searchProperties,
  mapSearch,
  autocomplete,
  getFilterMetadata,
  triggerReindex,
  getReindexStatus,
  getIndexHealth,
};
