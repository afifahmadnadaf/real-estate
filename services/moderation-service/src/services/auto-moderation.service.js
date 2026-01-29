'use strict';

const { prisma } = require('@real-estate/db-models');
const { PropertyModel } = require('@real-estate/db-models');

const config = require('../config');

/**
 * Calculate auto-moderation score for a property
 */
async function calculateScore(property) {
  let score = 50; // Base score

  // Title quality (10 points)
  if (property.title && property.title.length >= 20 && property.title.length <= 200) {
    score += 10;
  } else if (property.title && property.title.length < 10) {
    score -= 10;
  }

  // Description quality (10 points)
  if (property.description && property.description.length >= 100) {
    score += 10;
  } else if (!property.description || property.description.length < 50) {
    score -= 10;
  }

  // Pricing completeness (10 points)
  if (property.pricing && property.pricing.amount > 0) {
    score += 10;
  } else {
    score -= 10;
  }

  // Location completeness (10 points)
  if (property.location && property.location.cityId && property.location.localityId) {
    score += 10;
  } else {
    score -= 10;
  }

  // Attributes completeness (10 points)
  if (
    property.attributes &&
    property.attributes.propertyType &&
    property.attributes.bedrooms !== undefined &&
    property.attributes.bathrooms !== undefined
  ) {
    score += 10;
  } else {
    score -= 5;
  }

  // Media quality (20 points)
  const imageCount = property.media?.images?.length || 0;
  if (imageCount >= 5) {
    score += 20;
  } else if (imageCount >= 3) {
    score += 10;
  } else if (imageCount >= 1) {
    score += 5;
  } else {
    score -= 10;
  }

  // Has primary image
  const hasPrimaryImage = property.media?.images?.some((img) => img.isPrimary) || false;
  if (hasPrimaryImage) {
    score += 5;
  } else {
    score -= 5;
  }

  // Geo coordinates (5 points)
  if (property.location?.geo?.coordinates && property.location.geo.coordinates.length === 2) {
    score += 5;
  }

  // Contact information (5 points)
  if (property.contact && (property.contact.showPhone || property.contact.showEmail)) {
    score += 5;
  }

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return Math.round(score);
}

/**
 * Check blacklist
 */
async function checkBlacklist(property) {
  const blacklistChecks = [];

  // Check phone number
  if (property.contact?.maskedPhone) {
    const phoneEntry = await prisma.blacklistEntry.findFirst({
      where: {
        entryType: 'PHONE',
        value: property.contact.maskedPhone,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (phoneEntry) {
      blacklistChecks.push({
        type: 'PHONE',
        value: property.contact.maskedPhone,
        severity: phoneEntry.severity,
        reason: phoneEntry.reason,
      });
    }
  }

  // Check title/description for blacklisted words
  const blacklistedWords = await prisma.blacklistEntry.findMany({
    where: {
      entryType: 'WORD',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  const textToCheck = `${property.title} ${property.description || ''}`.toLowerCase();
  for (const entry of blacklistedWords) {
    if (textToCheck.includes(entry.value.toLowerCase())) {
      blacklistChecks.push({
        type: 'WORD',
        value: entry.value,
        severity: entry.severity,
        reason: entry.reason,
      });
    }
  }

  return blacklistChecks;
}

/**
 * Apply auto-moderation rules
 */
async function applyRules(entityType, entityId, property) {
  const rules = await prisma.moderationRule.findMany({
    where: {
      entityType,
      isActive: true,
    },
    orderBy: {
      priority: 'desc',
    },
  });

  const triggeredRules = [];

  for (const rule of rules) {
    try {
      const conditions = rule.conditions;
      let matches = true;

      // Simple condition matching (can be extended)
      if (conditions.minScore && property.moderation?.autoScore < conditions.minScore) {
        matches = false;
      }
      if (conditions.maxScore && property.moderation?.autoScore > conditions.maxScore) {
        matches = false;
      }
      if (
        conditions.requireImages &&
        (!property.media?.images || property.media.images.length < conditions.requireImages)
      ) {
        matches = false;
      }

      if (matches) {
        triggeredRules.push(rule);
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
    }
  }

  return triggeredRules;
}

/**
 * Auto-moderate property
 */
async function autoModerate(propertyId) {
  const property = await PropertyModel.findById(propertyId);
  if (!property) {
    throw new Error('Property not found');
  }

  // Calculate score
  const score = await calculateScore(property);

  // Check blacklist
  const blacklistChecks = await checkBlacklist(property);

  // Determine if manual review is required
  let manualReviewRequired = false;
  let autoDecision = null;

  if (blacklistChecks.length > 0) {
    // Blacklist hit - always requires manual review
    manualReviewRequired = true;
  } else if (score >= config.moderation.autoApproveThreshold) {
    // High score - auto approve
    autoDecision = 'APPROVE';
    manualReviewRequired = false;
  } else if (score <= config.moderation.autoRejectThreshold) {
    // Low score - auto reject
    autoDecision = 'REJECT';
    manualReviewRequired = false;
  } else {
    // Medium score - manual review
    manualReviewRequired = true;
  }

  // Update property moderation data
  await PropertyModel.findByIdAndUpdate(propertyId, {
    $set: {
      'moderation.autoScore': score,
      'moderation.manualReviewRequired': manualReviewRequired,
      'moderation.flags': blacklistChecks.map((check) => `${check.type}:${check.value}`),
    },
  });

  return {
    score,
    blacklistChecks,
    manualReviewRequired,
    autoDecision,
  };
}

module.exports = {
  calculateScore,
  checkBlacklist,
  applyRules,
  autoModerate,
};
