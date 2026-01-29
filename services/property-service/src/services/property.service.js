'use strict';

const { AppError, ErrorCodes } = require('@real-estate/common');
const { PropertyModel } = require('@real-estate/db-models');
const { createProducer, TOPICS, EVENT_TYPES } = require('@real-estate/events');

const propertyRepository = require('../repositories/property.repository');

const lifecycleService = require('./lifecycle.service');
const versionService = require('./version.service');

// Create a singleton producer instance
let eventProducer = null;

async function getProducer() {
  if (!eventProducer) {
    eventProducer = createProducer({ service: 'property-service' });
    await eventProducer.connect();
  }
  return eventProducer;
}

/**
 * Create a new property (draft)
 */
async function createProperty(userId, userRole, data, orgId = null) {
  // Determine owner type
  let ownerType = 'INDIVIDUAL';
  if (userRole === 'AGENT' || userRole === 'BUILDER') {
    ownerType = userRole;
  }

  // Generate slug from title
  const slug = await generateUniqueSlug(data.title);

  // Prepare property data
  const propertyData = {
    type: data.type,
    status: 'DRAFT',
    owner: {
      userId,
      orgId: orgId || data.orgId || null,
      type: ownerType,
    },
    title: data.title,
    slug,
    description: data.description || '',
    pricing: {
      ...data.pricing,
      pricePerSqft: calculatePricePerSqft(data.pricing.amount, data.attributes),
    },
    attributes: data.attributes,
    location: {
      ...data.location,
      geo: data.location.geo
        ? {
            type: 'Point',
            coordinates: [data.location.geo.lng, data.location.geo.lat],
          }
        : undefined,
    },
    contact: data.contact || {
      showPhone: true,
      showEmail: false,
      whatsappEnabled: false,
    },
    version: 1,
  };

  // Create property
  const property = await propertyRepository.create(propertyData);

  // Create initial version
  await versionService.createVersion(property._id.toString(), property.toObject(), {
    userId,
    type: 'USER',
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.PROPERTY,
    EVENT_TYPES.PROPERTY.CREATED,
    {
      propertyId: property._id.toString(),
      slug: property.slug,
      type: property.type,
      owner: property.owner,
      title: property.title,
      location: {
        cityId: property.location.cityId,
        city: property.location.city,
        localityId: property.location.localityId,
        locality: property.location.locality,
      },
      createdAt: property.createdAt.toISOString(),
    },
    { key: property._id.toString() }
  );

  return property;
}

/**
 * Get property by ID
 */
async function getProperty(id, includeArchived = false) {
  const property = await propertyRepository.findById(id);

  if (!includeArchived && property.status === 'ARCHIVED') {
    throw new AppError('Property not found', ErrorCodes.NOT_FOUND, 404);
  }

  return property;
}

/**
 * Update property (only if DRAFT or REJECTED)
 */
async function updateProperty(id, userId, orgId, data) {
  const property = await propertyRepository.findById(id);

  // Check ownership
  if (property.owner.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (orgId && property.owner.orgId !== orgId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  // Only allow updates in DRAFT or REJECTED status
  if (property.status !== 'DRAFT' && property.status !== 'REJECTED') {
    throw new AppError(
      'Property can only be updated in DRAFT or REJECTED status',
      ErrorCodes.INVALID_STATE_TRANSITION,
      400
    );
  }

  // Prepare update data
  const updateData = {};
  const changes = [];

  if (data.title !== undefined) {
    if (data.title !== property.title) {
      updateData.title = data.title;
      updateData.slug = await generateUniqueSlug(data.title, id);
      changes.push({ field: 'title', oldValue: property.title, newValue: data.title });
    }
  }

  if (data.description !== undefined) {
    updateData.description = data.description;
    changes.push({
      field: 'description',
      oldValue: property.description,
      newValue: data.description,
    });
  }

  if (data.pricing) {
    updateData.pricing = {
      ...property.pricing,
      ...data.pricing,
    };
    if (data.pricing.amount !== undefined) {
      updateData.pricing.pricePerSqft = calculatePricePerSqft(
        data.pricing.amount,
        data.attributes || property.attributes
      );
    }
    changes.push({ field: 'pricing', oldValue: property.pricing, newValue: updateData.pricing });
  }

  if (data.attributes) {
    updateData.attributes = {
      ...property.attributes,
      ...data.attributes,
    };
    changes.push({
      field: 'attributes',
      oldValue: property.attributes,
      newValue: updateData.attributes,
    });
  }

  if (data.location) {
    updateData.location = {
      ...property.location,
      ...data.location,
    };
    if (data.location.geo) {
      updateData.location.geo = {
        type: 'Point',
        coordinates: [data.location.geo.lng, data.location.geo.lat],
      };
    }
    changes.push({ field: 'location', oldValue: property.location, newValue: updateData.location });
  }

  if (data.contact) {
    updateData.contact = {
      ...property.contact,
      ...data.contact,
    };
    changes.push({ field: 'contact', oldValue: property.contact, newValue: updateData.contact });
  }

  // Increment version
  updateData.version = property.version + 1;

  // Update property
  const updatedProperty = await propertyRepository.update(id, updateData);

  // Create version snapshot
  if (changes.length > 0) {
    await versionService.createVersion(id, updatedProperty.toObject(), {
      userId,
      type: 'USER',
    });

    // Emit event
    const producer = await getProducer();
    await producer.publish(
      TOPICS.PROPERTY,
      EVENT_TYPES.PROPERTY.UPDATED,
      {
        propertyId: id,
        slug: updatedProperty.slug,
        changes,
        version: updatedProperty.version,
        updatedBy: userId,
        updatedAt: updatedProperty.updatedAt.toISOString(),
      },
      { key: id }
    );
  }

  return updatedProperty;
}

/**
 * Delete property
 */
async function deleteProperty(id, userId, orgId) {
  const property = await propertyRepository.findById(id);

  // Check ownership
  if (property.owner.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (orgId && property.owner.orgId !== orgId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  return propertyRepository.remove(id);
}

/**
 * List properties
 */
async function listProperties(filters = {}, options = {}) {
  return propertyRepository.list(filters, options);
}

/**
 * List user's properties
 */
async function listMyProperties(userId, orgId, filters = {}, options = {}) {
  return propertyRepository.findByOwner(userId, orgId, filters, options);
}

/**
 * Submit property for moderation
 */
async function submitForModeration(id, userId, orgId) {
  return lifecycleService.submit(id, userId, orgId);
}

/**
 * Generate unique slug
 */
async function generateUniqueSlug(title, excludeId = null) {
  const { generateSlug } = require('@real-estate/common');
  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;

  for (;;) {
    try {
      const existing = await propertyRepository.findBySlug(slug);
      if (!existing || (excludeId && existing._id.toString() === excludeId)) {
        return slug;
      }
    } catch (error) {
      // Property not found, slug is available
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Calculate price per sqft
 */
function calculatePricePerSqft(amount, attributes) {
  if (!amount || !attributes) {
    return null;
  }

  const area = attributes.carpetArea || attributes.builtUpArea || attributes.plotArea;
  if (!area || area === 0) {
    return null;
  }

  return Math.round(amount / area);
}

/**
 * Attach media to property
 */
async function attachMedia(id, userId, orgId, mediaData) {
  const property = await propertyRepository.findById(id);

  // Check ownership
  if (property.owner.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }
  if (orgId && property.owner.orgId !== orgId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  const { mediaId, type, order, isPrimary, alt, tags, label, name } = mediaData;

  // Initialize media arrays if not exists
  if (!property.media) {
    property.media = { images: [], videos: [], floorPlans: [], documents: [] };
  }

  const mediaItem = {
    mediaId,
    url: '', // Will be populated from media service
    order: order || property.media.images.length + property.media.videos.length,
    isPrimary: isPrimary || false,
  };

  if (type === 'image') {
    if (isPrimary) {
      // Unset primary from other images
      property.media.images.forEach((img) => {
        img.isPrimary = false;
      });
    }
    mediaItem.alt = alt || '';
    mediaItem.tags = tags || [];
    property.media.images.push(mediaItem);
  } else if (type === 'video') {
    property.media.videos.push(mediaItem);
  } else if (type === 'floorPlan') {
    mediaItem.label = label || '';
    property.media.floorPlans.push(mediaItem);
  } else if (type === 'document') {
    mediaItem.type = name || '';
    mediaItem.name = name || '';
    property.media.documents.push(mediaItem);
  }

  return propertyRepository.update(id, { media: property.media });
}

/**
 * Reorder media
 */
async function reorderMedia(id, userId, orgId, mediaIds) {
  const property = await propertyRepository.findById(id);

  // Check ownership
  if (property.owner.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }
  if (orgId && property.owner.orgId !== orgId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (!property.media) {
    throw new AppError('No media found', ErrorCodes.NOT_FOUND, 404);
  }

  // Reorder images
  const reorderedImages = [];
  mediaIds.forEach((mediaId, index) => {
    const image = property.media.images.find((img) => img.mediaId === mediaId);
    if (image) {
      image.order = index;
      reorderedImages.push(image);
    }
  });

  property.media.images = reorderedImages;
  return propertyRepository.update(id, { media: property.media });
}

/**
 * Detach media from property
 */
async function detachMedia(id, mediaId, userId, orgId) {
  const property = await propertyRepository.findById(id);

  // Check ownership
  if (property.owner.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }
  if (orgId && property.owner.orgId !== orgId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (!property.media) {
    throw new AppError('No media found', ErrorCodes.NOT_FOUND, 404);
  }

  // Remove from images
  property.media.images = property.media.images.filter((img) => img.mediaId !== mediaId);
  // Remove from videos
  property.media.videos = property.media.videos.filter((vid) => vid.mediaId !== mediaId);
  // Remove from floor plans
  property.media.floorPlans = property.media.floorPlans.filter((fp) => fp.mediaId !== mediaId);
  // Remove from documents
  property.media.documents = property.media.documents.filter((doc) => doc.mediaId !== mediaId);

  return propertyRepository.update(id, { media: property.media });
}

/**
 * Attach document to property
 */
async function attachDocument(id, userId, orgId, documentData) {
  const property = await propertyRepository.findById(id);

  // Check ownership
  if (property.owner.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }
  if (orgId && property.owner.orgId !== orgId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (!property.media) {
    property.media = { images: [], videos: [], floorPlans: [], documents: [] };
  }

  const document = {
    mediaId: documentData.mediaId,
    url: '',
    type: documentData.type,
    name: documentData.name,
  };

  property.media.documents.push(document);
  return propertyRepository.update(id, { media: property.media });
}

/**
 * Remove document from property
 */
async function removeDocument(id, docId, userId, orgId) {
  const property = await propertyRepository.findById(id);

  // Check ownership
  if (property.owner.userId !== userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }
  if (orgId && property.owner.orgId !== orgId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  if (!property.media || !property.media.documents) {
    throw new AppError('Document not found', ErrorCodes.NOT_FOUND, 404);
  }

  property.media.documents = property.media.documents.filter((doc) => doc.mediaId !== docId);
  return propertyRepository.update(id, { media: property.media });
}

/**
 * Get similar properties
 */
async function getSimilarProperties(id, limit = 10) {
  const property = await propertyRepository.findById(id);

  const filters = {
    status: 'PUBLISHED',
    type: property.type,
    'attributes.propertyType': property.attributes.propertyType,
    'location.cityId': property.location.cityId,
  };

  // Exclude current property
  const options = {
    limit,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  };

  const properties = await propertyRepository.list(filters, options);
  return properties.filter((p) => p._id.toString() !== id).slice(0, limit);
}

/**
 * Batch fetch properties by IDs
 */
async function batchFetchProperties(ids) {
  return propertyRepository.findByIds(ids);
}

/**
 * Get contact options for property
 */
async function getContactOptions(id, userId = null) {
  const property = await propertyRepository.findById(id);

  if (property.status !== 'PUBLISHED') {
    throw new AppError('Property not published', ErrorCodes.NOT_FOUND, 404);
  }

  const contactOptions = {
    showPhone: property.contact?.showPhone || false,
    showEmail: property.contact?.showEmail || false,
    whatsappEnabled: property.contact?.whatsappEnabled || false,
    preferredContactTime: property.contact?.preferredContactTime || null,
    maskedPhone: property.contact?.maskedPhone || null,
  };

  // If user is the owner, show full contact info
  if (userId && property.owner.userId === userId) {
    contactOptions.isOwner = true;
    // Return full contact details (would need to fetch from user service)
  }

  return contactOptions;
}

async function getAudit(id, userId, orgId = null, userRole = null) {
  const property = await propertyRepository.findById(id);

  if (userRole === 'ADMIN') {
    const versions = await versionService.getVersionHistory(id, 50);
    return { property, versions };
  }

  const isOwner = property.owner.userId === userId;
  const isOrgOwner = Boolean(orgId && property.owner.orgId && property.owner.orgId === orgId);
  if (!isOwner && !isOrgOwner) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  const versions = await versionService.getVersionHistory(id, 50);
  return { property, versions };
}

async function checkDuplicate(id) {
  const property = await propertyRepository.findById(id);
  const query = {
    _id: { $ne: property._id },
    status: { $ne: 'ARCHIVED' },
    'location.cityId': property.location?.cityId,
  };
  if (property.location?.localityId) {
    query['location.localityId'] = property.location.localityId;
  }
  const candidates = await PropertyModel.find(query).limit(20).exec();
  return { candidates };
}

module.exports = {
  createProperty,
  getProperty,
  updateProperty,
  deleteProperty,
  listProperties,
  listMyProperties,
  submitForModeration,
  attachMedia,
  reorderMedia,
  detachMedia,
  attachDocument,
  removeDocument,
  getSimilarProperties,
  batchFetchProperties,
  getContactOptions,
  getAudit,
  checkDuplicate,
};
