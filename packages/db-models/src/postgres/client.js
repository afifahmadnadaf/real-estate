'use strict';

const { PrismaClient } = require('@prisma/client');

/**
 * Prisma client singleton
 */
let prisma = null;

/**
 * Get or create the Prisma client
 * @returns {PrismaClient}
 */
function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
      errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
    });
  }
  return prisma;
}

/**
 * Connect to PostgreSQL via Prisma
 */
async function connectPrisma() {
  const client = getPrismaClient();
  await client.$connect();
  console.info('[PostgreSQL] Connected via Prisma');
  return client;
}

/**
 * Disconnect from PostgreSQL
 */
async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    console.info('[PostgreSQL] Disconnected');
  }
}

/**
 * Health check for PostgreSQL
 * @returns {Promise<boolean>}
 */
async function prismaHealthCheck() {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// Initialize singleton
prisma = getPrismaClient();

module.exports = {
  prisma,
  getPrismaClient,
  connectPrisma,
  disconnectPrisma,
  prismaHealthCheck,
};
