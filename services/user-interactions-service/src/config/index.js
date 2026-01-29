'use strict';

module.exports = {
  port: parseInt(process.env.USER_INTERACTIONS_SERVICE_PORT, 10) || 3012,
  env: process.env.NODE_ENV || 'development',

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },
};
