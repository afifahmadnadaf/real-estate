'use strict';

const { httpStatus } = require('@real-estate/common');

const geoService = require('../services/geo.service');

/**
 * List countries
 */
async function listCountries(req, res, next) {
  try {
    const countries = await geoService.listCountries();
    res.status(httpStatus.OK).json({
      success: true,
      data: countries,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List states
 */
async function listStates(req, res, next) {
  try {
    const states = await geoService.listStates(req.query.countryId);
    res.status(httpStatus.OK).json({
      success: true,
      data: states,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List cities
 */
async function listCities(req, res, next) {
  try {
    const filters = {
      featured: req.query.featured,
    };
    const cities = await geoService.listCities(req.query.stateId, filters);
    res.status(httpStatus.OK).json({
      success: true,
      data: cities,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get city
 */
async function getCity(req, res, next) {
  try {
    const { id } = req.params;
    const city = await geoService.getCity(id);
    res.status(httpStatus.OK).json({
      success: true,
      data: city,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List localities
 */
async function listLocalities(req, res, next) {
  try {
    const filters = {
      featured: req.query.featured,
    };
    const localities = await geoService.listLocalities(req.query.cityId, filters);
    res.status(httpStatus.OK).json({
      success: true,
      data: localities,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get locality
 */
async function getLocality(req, res, next) {
  try {
    const { id } = req.params;
    const locality = await geoService.getLocality(id);
    res.status(httpStatus.OK).json({
      success: true,
      data: locality,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get locality polygon
 */
async function getLocalityPolygon(req, res, next) {
  try {
    const { id } = req.params;
    const polygon = await geoService.getLocalityPolygon(id);
    res.status(httpStatus.OK).json({
      success: true,
      data: polygon,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Geocode address
 */
async function geocode(req, res, next) {
  try {
    const { address } = req.query;
    const result = await geoService.geocode(address);
    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reverse geocode
 */
async function reverseGeocode(req, res, next) {
  try {
    const { lat, lng } = req.query;
    const result = await geoService.reverseGeocode(lat, lng);
    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get nearby POIs
 */
async function getNearbyPois(req, res, next) {
  try {
    const { localityId, type } = req.query;
    const pois = await geoService.getNearbyPois(localityId, type);
    res.status(httpStatus.OK).json({
      success: true,
      data: pois,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List POIs
 */
async function listPois(req, res, next) {
  try {
    const filters = {
      localityId: req.query.localityId,
      type: req.query.type,
      limit: parseInt(req.query.limit, 10) || 200,
      offset: parseInt(req.query.offset, 10) || 0,
    };
    const pois = await geoService.listPois(filters);
    res.status(httpStatus.OK).json({
      success: true,
      data: pois,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get POI
 */
async function getPoi(req, res, next) {
  try {
    const { poiId } = req.params;
    const poi = await geoService.getPoi(poiId);
    res.status(httpStatus.OK).json({
      success: true,
      data: poi,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get clusters (optional)
 */
async function getClusters(req, res, next) {
  try {
    const clusters = await geoService.getClusters(req.query);
    res.status(httpStatus.OK).json({
      success: true,
      data: clusters,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create city (admin)
 */
async function createCity(req, res, next) {
  try {
    const city = await geoService.createCity(req.body);
    res.status(httpStatus.CREATED).json({
      success: true,
      data: city,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update city (admin)
 */
async function updateCity(req, res, next) {
  try {
    const { id } = req.params;
    const city = await geoService.updateCity(id, req.body);
    res.status(httpStatus.OK).json({
      success: true,
      data: city,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create locality (admin)
 */
async function createLocality(req, res, next) {
  try {
    const locality = await geoService.createLocality(req.body);
    res.status(httpStatus.CREATED).json({
      success: true,
      data: locality,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update locality (admin)
 */
async function updateLocality(req, res, next) {
  try {
    const { id } = req.params;
    const locality = await geoService.updateLocality(id, req.body);
    res.status(httpStatus.OK).json({
      success: true,
      data: locality,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create POI (admin)
 */
async function createPoi(req, res, next) {
  try {
    const poi = await geoService.createPoi(req.body);
    res.status(httpStatus.CREATED).json({
      success: true,
      data: poi,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update POI (admin)
 */
async function updatePoi(req, res, next) {
  try {
    const { id } = req.params;
    const poi = await geoService.updatePoi(id, req.body);
    res.status(httpStatus.OK).json({
      success: true,
      data: poi,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCountries,
  listStates,
  listCities,
  getCity,
  listLocalities,
  getLocality,
  getLocalityPolygon,
  geocode,
  reverseGeocode,
  getNearbyPois,
  listPois,
  getPoi,
  getClusters,
  createCity,
  updateCity,
  createLocality,
  updateLocality,
  createPoi,
  updatePoi,
};
