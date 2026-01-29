'use strict';

const { httpStatus } = require('@real-estate/common');

const searchService = require('../services/search.service');

/**
 * Search properties
 */
async function searchProperties(req, res, next) {
  try {
    const params = {
      q: req.query.q,
      type: req.query.type,
      cityId: req.query.cityId,
      localityId: req.query.localityId,
      minPrice: req.query.minPrice ? parseInt(req.query.minPrice, 10) : undefined,
      maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice, 10) : undefined,
      bedrooms: req.query.bedrooms ? parseInt(req.query.bedrooms, 10) : undefined,
      bathrooms: req.query.bathrooms ? parseInt(req.query.bathrooms, 10) : undefined,
      propertyType: req.query.propertyType,
      furnishing: req.query.furnishing,
      possessionStatus: req.query.possessionStatus,
      amenities: req.query.amenities ? req.query.amenities.split(',') : undefined,
      lat: req.query.lat,
      lng: req.query.lng,
      radius: req.query.radius ? parseFloat(req.query.radius) : undefined,
      sortBy: req.query.sortBy || 'relevance',
      sortOrder: req.query.sortOrder || 'desc',
      limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined,
    };

    const result = await searchService.searchProperties(params);

    res.status(httpStatus.OK).json({
      success: true,
      data: result.properties,
      meta: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Map/geo search
 */
async function mapSearch(req, res, next) {
  try {
    const params = {
      bounds: req.query.bounds
        ? JSON.parse(req.query.bounds)
        : {
            north: parseFloat(req.query.north),
            south: parseFloat(req.query.south),
            east: parseFloat(req.query.east),
            west: parseFloat(req.query.west),
          },
      zoom: req.query.zoom ? parseInt(req.query.zoom, 10) : undefined,
    };

    const properties = await searchService.mapSearch(params);

    res.status(httpStatus.OK).json({
      success: true,
      data: properties,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Autocomplete
 */
async function autocomplete(req, res, next) {
  try {
    const { q } = req.query;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;

    if (!q || q.length < 2) {
      return res.status(httpStatus.OK).json({
        success: true,
        data: [],
      });
    }

    const suggestions = await searchService.autocomplete(q, limit);

    res.status(httpStatus.OK).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get filter metadata
 */
async function getFilterMetadata(req, res, next) {
  try {
    const cityId = req.query.cityId || null;
    const metadata = await searchService.getFilterMetadata(cityId);

    res.status(httpStatus.OK).json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get trending searches (placeholder)
 */
async function getTrending(req, res, next) {
  try {
    // TODO: Implement trending searches from analytics
    res.status(httpStatus.OK).json({
      success: true,
      data: [],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get recent searches (placeholder - would use Redis)
 */
async function getRecent(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(httpStatus.OK).json({
        success: true,
        data: [],
      });
    }
    // TODO: Implement recent searches from Redis
    res.status(httpStatus.OK).json({
      success: true,
      data: [],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Clear recent searches
 */
async function clearRecent(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(httpStatus.OK).json({
        success: true,
        message: 'No recent searches to clear',
      });
    }
    // TODO: Clear from Redis
    res.status(httpStatus.OK).json({
      success: true,
      message: 'Recent searches cleared',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Trigger reindex (admin)
 */
async function triggerReindex(req, res, next) {
  try {
    const taskId = await searchService.triggerReindex();

    res.status(httpStatus.ACCEPTED).json({
      success: true,
      data: {
        taskId,
        status: 'initiated',
        message: 'Reindex task started',
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get reindex status (admin)
 */
async function getReindexStatus(req, res, next) {
  try {
    const { taskId } = req.params;
    const status = await searchService.getReindexStatus(taskId);

    res.status(httpStatus.OK).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get index health (admin)
 */
async function getIndexHealth(req, res, next) {
  try {
    const health = await searchService.getIndexHealth();

    res.status(httpStatus.OK).json({
      success: true,
      data: health,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  searchProperties,
  mapSearch,
  autocomplete,
  getFilterMetadata,
  getTrending,
  getRecent,
  clearRecent,
  triggerReindex,
  getReindexStatus,
  getIndexHealth,
};
