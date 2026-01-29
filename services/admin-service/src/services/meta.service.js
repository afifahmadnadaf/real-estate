'use strict';

const { prisma } = require('@real-estate/db-models');

const DEFAULTS = {
  'property-types': [
    { value: 'APARTMENT', label: 'Apartment' },
    { value: 'HOUSE', label: 'House' },
    { value: 'PLOT', label: 'Plot' },
    { value: 'OFFICE', label: 'Office' },
  ],
  amenities: [
    { value: 'PARKING', label: 'Parking' },
    { value: 'POWER_BACKUP', label: 'Power Backup' },
    { value: 'LIFT', label: 'Lift' },
  ],
  furnishing: [
    { value: 'UNFURNISHED', label: 'Unfurnished' },
    { value: 'SEMI_FURNISHED', label: 'Semi Furnished' },
    { value: 'FURNISHED', label: 'Furnished' },
  ],
  facing: [
    { value: 'NORTH', label: 'North' },
    { value: 'SOUTH', label: 'South' },
    { value: 'EAST', label: 'East' },
    { value: 'WEST', label: 'West' },
  ],
  'ownership-types': [
    { value: 'FREEHOLD', label: 'Freehold' },
    { value: 'LEASEHOLD', label: 'Leasehold' },
  ],
  availability: [
    { value: 'IMMEDIATE', label: 'Immediate' },
    { value: 'WITHIN_3_MONTHS', label: 'Within 3 months' },
  ],
  'sort-options': [
    { value: 'RELEVANCE', label: 'Relevance' },
    { value: 'PRICE_LOW_HIGH', label: 'Price: Low to High' },
    { value: 'PRICE_HIGH_LOW', label: 'Price: High to Low' },
    { value: 'NEWEST', label: 'Newest' },
  ],
};

async function listCategory(category) {
  const items = await prisma.metaItem.findMany({
    where: { category, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  if (items.length > 0) {
    return items;
  }
  const fallback = DEFAULTS[category] || [];
  return fallback.map((i, idx) => ({
    id: `${category}:${i.value}`,
    category,
    value: i.value,
    label: i.label,
    sortOrder: idx,
    isActive: true,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

async function adminList(category) {
  return prisma.metaItem.findMany({
    where: { category },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

async function adminCreate(category, data) {
  return prisma.metaItem.create({
    data: {
      category,
      value: data.value,
      label: data.label || null,
      sortOrder: data.sortOrder || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
      metadata: data.metadata || null,
    },
  });
}

async function adminUpdate(id, data) {
  return prisma.metaItem.update({
    where: { id },
    data: {
      value: data.value,
      label: data.label,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      metadata: data.metadata,
    },
  });
}

async function adminDelete(id) {
  await prisma.metaItem.delete({ where: { id } });
  return { success: true };
}

module.exports = {
  listCategory,
  adminList,
  adminCreate,
  adminUpdate,
  adminDelete,
};
