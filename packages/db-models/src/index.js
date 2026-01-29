'use strict';

/**
 * @real-estate/db-models
 * Database models and connections for the Real Estate Platform
 */

const { connectMongo, disconnectMongo, getMongoConnection } = require('./mongo/connection');
const MediaModel = require('./mongo/media.model');
const ProjectModel = require('./mongo/project.model');
const PropertyVersionModel = require('./mongo/property-version.model');
const PropertyModel = require('./mongo/property.model');
const { prisma, connectPrisma, disconnectPrisma } = require('./postgres/client');

module.exports = {
  // MongoDB
  connectMongo,
  disconnectMongo,
  getMongoConnection,

  // MongoDB Models
  PropertyModel,
  ProjectModel,
  MediaModel,
  PropertyVersionModel,

  // PostgreSQL (Prisma)
  prisma,
  connectPrisma,
  disconnectPrisma,
};
