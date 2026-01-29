'use strict';

const { createLogger } = require('@real-estate/common');
const { PropertyModel } = require('@real-estate/db-models');

const { indexProperty, deleteProperty } = require('../services/elasticsearch.service');

const logger = createLogger({ service: 'search-indexer-worker' });

/**
 * Index a property to Elasticsearch
 */
async function indexPropertyById(propertyId) {
  try {
    const property = await PropertyModel.findById(propertyId);
    if (!property) {
      logger.warn({ propertyId }, 'Property not found for indexing');
      return;
    }

    // Only index published properties
    if (property.status !== 'PUBLISHED') {
      logger.debug({ propertyId, status: property.status }, 'Skipping non-published property');
      return;
    }

    await indexProperty(property);
    logger.info({ propertyId }, 'Property indexed successfully');
  } catch (error) {
    logger.error({ error, propertyId }, 'Failed to index property');
    throw error;
  }
}

/**
 * Delete property from Elasticsearch
 */
async function deletePropertyById(propertyId) {
  try {
    await deleteProperty(propertyId);
    logger.info({ propertyId }, 'Property deleted from index');
  } catch (error) {
    logger.error({ error, propertyId }, 'Failed to delete property from index');
    throw error;
  }
}

module.exports = {
  indexProperty: indexPropertyById,
  deleteProperty: deletePropertyById,
};
