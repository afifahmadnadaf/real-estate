'use strict';

const { prisma } = require('@real-estate/db-models');

/**
 * Find user by ID
 */
async function findById(id) {
  return prisma.user.findUnique({
    where: { id },
  });
}

/**
 * Find user by email
 */
async function findByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Find user by phone
 */
async function findByPhone(phone) {
  return prisma.user.findUnique({
    where: { phone },
  });
}

/**
 * Find user by identifier (phone or email)
 */
async function findByIdentifier(identifier, identifierType) {
  if (identifierType === 'PHONE') {
    return findByPhone(identifier);
  }
  return findByEmail(identifier);
}

/**
 * Create user
 */
async function create(data) {
  return prisma.user.create({
    data,
  });
}

/**
 * Update user
 */
async function update(id, data) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

/**
 * Delete user
 */
async function remove(id) {
  return prisma.user.delete({
    where: { id },
  });
}

/**
 * Check if email exists
 */
async function emailExists(email, excludeId = null) {
  const where = { email };
  if (excludeId) {
    where.NOT = { id: excludeId };
  }
  const count = await prisma.user.count({ where });
  return count > 0;
}

/**
 * Check if phone exists
 */
async function phoneExists(phone, excludeId = null) {
  const where = { phone };
  if (excludeId) {
    where.NOT = { id: excludeId };
  }
  const count = await prisma.user.count({ where });
  return count > 0;
}

module.exports = {
  findById,
  findByEmail,
  findByPhone,
  findByIdentifier,
  create,
  update,
  remove,
  emailExists,
  phoneExists,
};
