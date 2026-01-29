'use strict';

const { AppError, ErrorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');
const { createProducer, TOPICS, EVENT_TYPES } = require('@real-estate/events');

// Create a singleton producer instance
let eventProducer = null;

async function getProducer() {
  if (!eventProducer) {
    eventProducer = createProducer({ service: 'lead-service' });
    await eventProducer.connect();
  }
  return eventProducer;
}

/**
 * Create lead
 */
async function createLead(data) {
  const lead = await prisma.lead.create({
    data: {
      ...data,
      status: 'NEW',
      spamScore: 0,
    },
    include: {
      buyer: true,
      seller: true,
      organization: true,
    },
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.LEAD,
    EVENT_TYPES.LEAD.CREATED,
    {
      leadId: lead.id,
      propertyId: lead.propertyId,
      buyerId: lead.buyerId,
      sellerId: lead.sellerId,
      orgId: lead.orgId,
      source: lead.source,
      createdAt: lead.createdAt.toISOString(),
    },
    { key: lead.id }
  );

  return lead;
}

/**
 * Get lead by ID
 */
async function getLead(leadId, userId = null) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      buyer: true,
      seller: true,
      assignedTo: true,
      organization: true,
      notes: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      activities: {
        include: {
          actor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      appointments: {
        orderBy: { scheduledAt: 'asc' },
      },
    },
  });

  if (!lead) {
    throw new AppError('Lead not found', ErrorCodes.NOT_FOUND, 404);
  }

  // Check access
  if (userId) {
    const hasAccess =
      lead.sellerId === userId ||
      lead.buyerId === userId ||
      lead.assignedToId === userId ||
      (lead.orgId && lead.organization?.members?.some((m) => m.userId === userId));

    if (!hasAccess) {
      throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
    }
  }

  return lead;
}

/**
 * List leads
 */
async function listLeads(filters = {}, options = {}) {
  const {
    sellerId,
    orgId,
    assignedToId,
    status,
    source,
    limit = 20,
    offset = 0,
  } = { ...filters, ...options };

  const where = {};
  if (sellerId) {
    where.sellerId = sellerId;
  }
  if (orgId) {
    where.orgId = orgId;
  }
  if (assignedToId) {
    where.assignedToId = assignedToId;
  }
  if (status) {
    where.status = status;
  }
  if (source) {
    where.source = source;
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    leads,
    total,
    limit,
    offset,
  };
}

/**
 * Update lead status
 */
async function updateLeadStatus(leadId, userId, status, metadata = {}) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw new AppError('Lead not found', ErrorCodes.NOT_FOUND, 404);
  }

  const updateData = { status, ...metadata };

  if (status === 'CONTACTED' && !lead.contactedAt) {
    updateData.contactedAt = new Date();
  }

  if (status === 'CONVERTED' && !lead.convertedAt) {
    updateData.convertedAt = new Date();
  }

  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: updateData,
  });

  // Create activity
  await prisma.leadActivity.create({
    data: {
      leadId,
      actorId: userId,
      activityType: 'STATUS_CHANGED',
      details: {
        previousStatus: lead.status,
        newStatus: status,
        ...metadata,
      },
    },
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.LEAD,
    EVENT_TYPES.LEAD.STATUS_CHANGED,
    {
      leadId,
      previousStatus: lead.status,
      newStatus: status,
      changedBy: userId,
      changedAt: new Date().toISOString(),
    },
    { key: leadId }
  );

  return updatedLead;
}

/**
 * Assign lead
 */
async function assignLead(leadId, assignedToId, assignedBy) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw new AppError('Lead not found', ErrorCodes.NOT_FOUND, 404);
  }

  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      assignedToId,
    },
  });

  // Create activity
  await prisma.leadActivity.create({
    data: {
      leadId,
      actorId: assignedBy,
      activityType: 'ASSIGNED',
      details: {
        assignedTo: assignedToId,
      },
    },
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.LEAD,
    EVENT_TYPES.LEAD.ASSIGNED,
    {
      leadId,
      assignedTo: assignedToId,
      assignedBy,
      assignedAt: new Date().toISOString(),
    },
    { key: leadId }
  );

  return updatedLead;
}

/**
 * Add note to lead
 */
async function addNote(leadId, authorId, content, isInternal = true) {
  const note = await prisma.leadNote.create({
    data: {
      leadId,
      authorId,
      content,
      isInternal,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Create activity
  await prisma.leadActivity.create({
    data: {
      leadId,
      actorId: authorId,
      activityType: 'NOTE_ADDED',
      details: {
        noteId: note.id,
        isInternal,
      },
    },
  });

  return note;
}

/**
 * List lead notes
 */
async function listNotes(leadId, includeInternal = false) {
  const where = { leadId };
  if (!includeInternal) {
    where.isInternal = false;
  }

  return prisma.leadNote.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Mark lead as spam
 */
async function markSpam(leadId, userId) {
  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: 'SPAM',
      spamScore: 100,
    },
  });

  // Create activity
  await prisma.leadActivity.create({
    data: {
      leadId,
      actorId: userId,
      activityType: 'MARKED_SPAM',
    },
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.LEAD,
    EVENT_TYPES.LEAD.MARKED_SPAM,
    {
      leadId,
      markedBy: userId,
      markedAt: new Date().toISOString(),
    },
    { key: leadId }
  );

  return lead;
}

/**
 * Unmark spam
 */
async function unmarkSpam(leadId, userId) {
  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: 'NEW',
      spamScore: 0,
    },
  });

  // Create activity
  await prisma.leadActivity.create({
    data: {
      leadId,
      actorId: userId,
      activityType: 'UNMARKED_SPAM',
    },
  });

  return lead;
}

/**
 * Create appointment
 */
async function createAppointment(leadId, data, createdById) {
  const appointment = await prisma.appointment.create({
    data: {
      ...data,
      leadId,
      createdById,
      status: 'SCHEDULED',
    },
  });

  // Create activity
  await prisma.leadActivity.create({
    data: {
      leadId,
      actorId: createdById,
      activityType: 'APPOINTMENT_SCHEDULED',
      details: {
        appointmentId: appointment.id,
        scheduledAt: appointment.scheduledAt,
      },
    },
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.LEAD,
    EVENT_TYPES.LEAD.APPOINTMENT_SCHEDULED,
    {
      leadId,
      appointmentId: appointment.id,
      scheduledAt: appointment.scheduledAt.toISOString(),
      createdBy: createdById,
    },
    { key: leadId }
  );

  return appointment;
}

/**
 * Get appointment
 */
async function getAppointment(leadId) {
  return prisma.appointment.findFirst({
    where: { leadId },
    orderBy: { scheduledAt: 'desc' },
  });
}

/**
 * Update appointment
 */
async function updateAppointment(appointmentId, data, userId) {
  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data,
  });

  // Create activity
  await prisma.leadActivity.create({
    data: {
      leadId: appointment.leadId,
      actorId: userId,
      activityType: 'APPOINTMENT_UPDATED',
      details: {
        appointmentId,
        changes: data,
      },
    },
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.LEAD,
    EVENT_TYPES.LEAD.APPOINTMENT_UPDATED,
    {
      leadId: appointment.leadId,
      appointmentId,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    },
    { key: appointment.leadId }
  );

  return appointment;
}

/**
 * Cancel appointment
 */
async function cancelAppointment(appointmentId, userId) {
  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: 'CANCELLED',
    },
  });

  // Create activity
  await prisma.leadActivity.create({
    data: {
      leadId: appointment.leadId,
      actorId: userId,
      activityType: 'APPOINTMENT_CANCELLED',
      details: {
        appointmentId,
      },
    },
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.LEAD,
    EVENT_TYPES.LEAD.APPOINTMENT_CANCELLED,
    {
      leadId: appointment.leadId,
      appointmentId,
      cancelledBy: userId,
      cancelledAt: new Date().toISOString(),
    },
    { key: appointment.leadId }
  );

  return appointment;
}

/**
 * Get lead metrics
 */
async function getMetrics(userId, orgId = null, filters = {}) {
  const where = {};
  if (orgId) {
    where.orgId = orgId;
  } else if (userId) {
    where.sellerId = userId;
  }

  if (filters.startDate) {
    where.createdAt = { gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    where.createdAt = {
      ...where.createdAt,
      lte: new Date(filters.endDate),
    };
  }

  const [total, byStatus, bySource, converted] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
    prisma.lead.groupBy({
      by: ['source'],
      where,
      _count: true,
    }),
    prisma.lead.count({
      where: {
        ...where,
        status: 'CONVERTED',
      },
    }),
  ]);

  return {
    total,
    byStatus: byStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {}),
    bySource: bySource.reduce((acc, item) => {
      acc[item.source] = item._count;
      return acc;
    }, {}),
    converted,
    conversionRate: total > 0 ? (converted / total) * 100 : 0,
  };
}

/**
 * Request a callback for a lead
 */
async function requestCallback(leadId, userId, metadata = {}) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw new AppError('Lead not found', ErrorCodes.NOT_FOUND, 404);
  }

  await prisma.leadActivity.create({
    data: {
      leadId,
      actorId: userId,
      activityType: 'CALL_REQUESTED',
      details: metadata,
    },
  });

  return { success: true };
}

module.exports = {
  createLead,
  getLead,
  listLeads,
  updateLeadStatus,
  assignLead,
  addNote,
  listNotes,
  markSpam,
  unmarkSpam,
  createAppointment,
  getAppointment,
  updateAppointment,
  cancelAppointment,
  requestCallback,
  getMetrics,
};
