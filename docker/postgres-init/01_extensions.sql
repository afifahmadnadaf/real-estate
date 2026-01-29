-- PostgreSQL Extensions for Real Estate Platform
-- Run this first to enable required extensions

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Full-text search improvements (optional)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Geospatial (if using PostGIS instead of MongoDB geo)
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- Output confirmation
DO $$
BEGIN
  RAISE NOTICE 'PostgreSQL extensions installed successfully';
END $$;

