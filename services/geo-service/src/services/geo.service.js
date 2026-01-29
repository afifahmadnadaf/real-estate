'use strict';

const { prisma } = require('@real-estate/db-models');

/**
 * List countries
 */
async function listCountries() {
  return prisma.country.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
}

/**
 * List states
 */
async function listStates(countryId = null) {
  const where = { isActive: true };
  if (countryId) {
    where.countryId = countryId;
  }

  return prisma.state.findMany({
    where,
    include: { country: true },
    orderBy: { name: 'asc' },
  });
}

/**
 * List cities
 */
async function listCities(stateId = null, filters = {}) {
  const where = { isActive: true };
  if (stateId) {
    where.stateId = stateId;
  }
  if (filters.featured !== undefined) {
    where.isFeatured = filters.featured === 'true';
  }

  return prisma.city.findMany({
    where,
    include: { state: { include: { country: true } } },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get city by ID
 */
async function getCity(cityId) {
  const city = await prisma.city.findUnique({
    where: { id: cityId },
    include: {
      state: {
        include: {
          country: true,
        },
      },
    },
  });

  if (!city) {
    throw new Error('City not found');
  }

  return city;
}

/**
 * List localities
 */
async function listLocalities(cityId = null, filters = {}) {
  const where = { isActive: true };
  if (cityId) {
    where.cityId = cityId;
  }
  if (filters.featured !== undefined) {
    where.isFeatured = filters.featured === 'true';
  }

  return prisma.locality.findMany({
    where,
    include: { city: true },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get locality by ID
 */
async function getLocality(localityId) {
  const locality = await prisma.locality.findUnique({
    where: { id: localityId },
    include: {
      city: {
        include: {
          state: {
            include: {
              country: true,
            },
          },
        },
      },
    },
  });

  if (!locality) {
    throw new Error('Locality not found');
  }

  return locality;
}

/**
 * Get locality polygon (boundary)
 */
async function getLocalityPolygon(localityId) {
  const locality = await getLocality(localityId);
  return locality.polygon;
}

/**
 * Forward geocode (address to coordinates)
 */
async function geocode(address) {
  // Check if provider is configured, otherwise fallback to mock if dev/test
  const provider = process.env.GEOCODING_PROVIDER || 'mock';
  
  if (provider === 'mock' || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return {
      address,
      lat: 28.6139, // Default to New Delhi
      lng: 77.209,
      formattedAddress: address,
      isMock: true
    };
  }

  // TODO: Integrate with Google Maps Geocoding API or Nominatim
  throw new Error('Geocoding provider not configured');
}

/**
 * Reverse geocode (coordinates to address)
 */
async function reverseGeocode(lat, lng) {
  // Check if provider is configured, otherwise fallback to mock if dev/test
  const provider = process.env.GEOCODING_PROVIDER || 'mock';

  if (provider === 'mock' || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      address: 'Mock Address, New Delhi, India',
      locality: 'Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      isMock: true
    };
  }

  // TODO: Integrate with Google Maps Reverse Geocoding API or Nominatim
  throw new Error('Geocoding provider not configured');
}

/**
 * Get nearby POIs
 */
async function getNearbyPois(localityId, type = null) {
  const where = { localityId };
  if (type) {
    where.type = type;
  }

  return prisma.poi.findMany({
    where,
    orderBy: { name: 'asc' },
  });
}

/**
 * List POIs
 */
async function listPois(filters = {}) {
  const where = {};
  if (filters.localityId) {
    where.localityId = filters.localityId;
  }
  if (filters.type) {
    where.type = filters.type;
  }
  return prisma.poi.findMany({
    where,
    orderBy: { name: 'asc' },
    take: filters.limit || 200,
    skip: filters.offset || 0,
  });
}

/**
 * Get POI by ID
 */
async function getPoi(poiId) {
  const poi = await prisma.poi.findUnique({
    where: { id: poiId },
    include: {
      locality: {
        include: {
          city: true,
        },
      },
    },
  });
  if (!poi) {
    throw new Error('POI not found');
  }
  return poi;
}

/**
 * Get clusters (optional)
 */
async function getClusters() {
  return [];
}

/**
 * Create city (admin)
 */
async function createCity(data) {
  return prisma.city.create({
    data,
  });
}

/**
 * Update city (admin)
 */
async function updateCity(cityId, data) {
  return prisma.city.update({
    where: { id: cityId },
    data,
  });
}

/**
 * Create locality (admin)
 */
async function createLocality(data) {
  return prisma.locality.create({
    data,
  });
}

/**
 * Update locality (admin)
 */
async function updateLocality(localityId, data) {
  return prisma.locality.update({
    where: { id: localityId },
    data,
  });
}

/**
 * Create POI (admin)
 */
async function createPoi(data) {
  return prisma.poi.create({
    data,
  });
}

/**
 * Update POI (admin)
 */
async function updatePoi(poiId, data) {
  return prisma.poi.update({
    where: { id: poiId },
    data,
  });
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
