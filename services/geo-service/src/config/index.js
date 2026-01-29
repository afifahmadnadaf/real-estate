'use strict';

module.exports = {
  port: parseInt(process.env.GEO_SERVICE_PORT, 10) || 3010,
  env: process.env.NODE_ENV || 'development',

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Geocoding (Google Maps API)
  geocoding: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
    provider: process.env.GEOCODING_PROVIDER || 'google', // google, nominatim
  },
};
