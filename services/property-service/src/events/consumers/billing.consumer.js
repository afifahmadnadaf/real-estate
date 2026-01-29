'use strict';

const { createLogger } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

const propertyRepository = require('../../repositories/property.repository');

const logger = createLogger({ service: 'property-service' });

/**
 * Handle subscription activated event
 * @param {Object} payload - Event payload
 * @param {Object} context - Kafka context
 * @param {Object} event - Full event envelope
 */
async function handleSubscriptionActivated(payload, context, event) {
  try {
    const { subscriptionId, userId, orgId, packageId } = payload;

    // Get package details
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg || !pkg.boostTier) {
      return; // No boost tier configured
    }

    // Get all published properties for this user/org
    const query = { status: 'PUBLISHED', 'owner.userId': userId };
    if (orgId) {
      query['owner.orgId'] = orgId;
    }

    const properties = await propertyRepository.findByQuery(query);

    // Update premium tier for all published properties
    for (const property of properties) {
      await propertyRepository.updatePremium(property._id.toString(), {
        tier: pkg.boostTier,
        activatedAt: new Date(),
        subscriptionId,
      });

      logger.info(
        { propertyId: property._id, tier: pkg.boostTier },
        'Property premium tier updated'
      );
    }
  } catch (error) {
    logger.error(
      { error, eventId: event?.eventId, eventType: event?.eventType },
      'Error handling subscription activated'
    );
  }
}

/**
 * Handle subscription cancelled/expired event
 * @param {Object} payload - Event payload
 * @param {Object} context - Kafka context
 * @param {Object} event - Full event envelope
 */
async function handleSubscriptionCancelled(payload, context, event) {
  try {
    const { subscriptionId, userId, orgId } = payload;

    // Get all published properties with this subscription
    const query = {
      status: 'PUBLISHED',
      'owner.userId': userId,
      'premium.subscriptionId': subscriptionId,
    };
    if (orgId) {
      query['owner.orgId'] = orgId;
    }

    const properties = await propertyRepository.findByQuery(query);

    // Remove premium tier
    for (const property of properties) {
      await propertyRepository.updatePremium(property._id.toString(), {
        tier: 'NONE',
        activatedAt: null,
        subscriptionId: null,
      });

      logger.info({ propertyId: property._id }, 'Property premium tier removed');
    }
  } catch (error) {
    logger.error(
      { error, eventId: event?.eventId, eventType: event?.eventType },
      'Error handling subscription cancelled'
    );
  }
}

module.exports = {
  handleSubscriptionActivated,
  handleSubscriptionCancelled,
};
