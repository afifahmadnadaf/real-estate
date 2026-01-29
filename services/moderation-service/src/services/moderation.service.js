'use strict';

const { AppError, ErrorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');
const { PropertyModel } = require('@real-estate/db-models');
const { createProducer, TOPICS, EVENT_TYPES } = require('@real-estate/events');

const autoModerationService = require('./auto-moderation.service');

// Create a singleton producer instance
let eventProducer = null;

async function getProducer() {
  if (!eventProducer) {
    eventProducer = createProducer({ service: 'moderation-service' });
    await eventProducer.connect();
  }
  return eventProducer;
}

/**
 * Create moderation task
 */
async function createTask(entityType, entityId, taskType, priority = 'MEDIUM', autoScore = null) {
  const task = await prisma.moderationTask.create({
    data: {
      entityType,
      entityId,
      taskType,
      priority,
      autoScore,
      status: 'PENDING',
    },
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.MODERATION,
    EVENT_TYPES.MODERATION.TASK_CREATED,
    {
      taskId: task.id,
      entityType,
      entityId,
      taskType,
      priority,
      autoScore,
      createdAt: task.createdAt.toISOString(),
    },
    { key: task.id }
  );

  return task;
}

/**
 * Auto-moderate property and create task if needed
 */
async function processPropertySubmission(propertyId) {
  const result = await autoModerationService.autoModerate(propertyId);

  if (result.autoDecision === 'APPROVE') {
    // Auto-approve - update property status
    await PropertyModel.findByIdAndUpdate(propertyId, {
      $set: { status: 'UNDER_REVIEW' },
    });

    // Emit auto-approved event
    const producer = await getProducer();
    await producer.publish(
      TOPICS.MODERATION,
      EVENT_TYPES.MODERATION.AUTO_APPROVED,
      {
        entityType: 'PROPERTY',
        entityId: propertyId,
        score: result.score,
        approvedAt: new Date().toISOString(),
      },
      { key: propertyId }
    );
  } else if (result.autoDecision === 'REJECT') {
    // Auto-reject
    await PropertyModel.findByIdAndUpdate(propertyId, {
      $set: {
        status: 'REJECTED',
        'moderation.rejectionReason': 'Auto-rejected due to low quality score',
      },
    });

    // Emit auto-rejected event
    const producer = await getProducer();
    await producer.publish(
      TOPICS.MODERATION,
      EVENT_TYPES.MODERATION.AUTO_REJECTED,
      {
        entityType: 'PROPERTY',
        entityId: propertyId,
        score: result.score,
        rejectedAt: new Date().toISOString(),
      },
      { key: propertyId }
    );
  } else if (result.manualReviewRequired) {
    // Create moderation task
    await createTask('PROPERTY', propertyId, 'NEW_LISTING', 'MEDIUM', result.score);
  }

  return result;
}

/**
 * Get moderation queue
 */
async function getQueue(filters = {}, options = {}) {
  const {
    status = 'PENDING',
    taskType,
    priority,
    limit = 50,
    offset = 0,
  } = { ...filters, ...options };

  const where = { status };
  if (taskType) {
    where.taskType = taskType;
  }
  if (priority) {
    where.priority = priority;
  }

  const [tasks, total] = await Promise.all([
    prisma.moderationTask.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      skip: offset,
      take: limit,
    }),
    prisma.moderationTask.count({ where }),
  ]);

  return {
    tasks,
    total,
    limit,
    offset,
  };
}

/**
 * Get task by ID
 */
async function getTask(taskId) {
  const task = await prisma.moderationTask.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new AppError('Task not found', ErrorCodes.NOT_FOUND, 404);
  }

  return task;
}

/**
 * Claim task
 */
async function claimTask(taskId, reviewerId) {
  const task = await prisma.moderationTask.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new AppError('Task not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (task.status !== 'PENDING') {
    throw new AppError(
      'Task is not available for claiming',
      ErrorCodes.INVALID_STATE_TRANSITION,
      400
    );
  }

  const updatedTask = await prisma.moderationTask.update({
    where: { id: taskId },
    data: {
      status: 'CLAIMED',
      claimedById: reviewerId,
      claimedAt: new Date(),
    },
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.MODERATION,
    EVENT_TYPES.MODERATION.TASK_CLAIMED,
    {
      taskId,
      claimedBy: reviewerId,
      claimedAt: updatedTask.claimedAt.toISOString(),
    },
    { key: taskId }
  );

  return updatedTask;
}

/**
 * Release task
 */
async function releaseTask(taskId, reviewerId) {
  const task = await prisma.moderationTask.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new AppError('Task not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (task.status !== 'CLAIMED' || task.claimedById !== reviewerId) {
    throw new AppError('Task cannot be released', ErrorCodes.INVALID_STATE_TRANSITION, 400);
  }

  const updatedTask = await prisma.moderationTask.update({
    where: { id: taskId },
    data: {
      status: 'PENDING',
      claimedById: null,
      claimedAt: null,
    },
  });

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.MODERATION,
    EVENT_TYPES.MODERATION.TASK_RELEASED,
    {
      taskId,
      releasedBy: reviewerId,
      releasedAt: new Date().toISOString(),
    },
    { key: taskId }
  );

  return updatedTask;
}

/**
 * Make decision on task
 */
async function makeDecision(taskId, reviewerId, decision, notes = '') {
  const task = await prisma.moderationTask.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new AppError('Task not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (task.status !== 'CLAIMED' || task.claimedById !== reviewerId) {
    throw new AppError('Task is not claimed by you', ErrorCodes.FORBIDDEN, 403);
  }

  const updatedTask = await prisma.moderationTask.update({
    where: { id: taskId },
    data: {
      status: 'COMPLETED',
      reviewedById: reviewerId,
      reviewDecision: decision,
      reviewNotes: notes,
      reviewedAt: new Date(),
    },
  });

  // Update entity based on decision
  if (task.entityType === 'PROPERTY') {
    if (decision === 'APPROVE') {
      await PropertyModel.findByIdAndUpdate(task.entityId, {
        $set: {
          status: 'UNDER_REVIEW',
          'moderation.reviewerId': reviewerId,
          'moderation.reviewNotes': notes,
        },
      });
    } else if (decision === 'REJECT') {
      await PropertyModel.findByIdAndUpdate(task.entityId, {
        $set: {
          status: 'REJECTED',
          'moderation.reviewerId': reviewerId,
          'moderation.reviewNotes': notes,
          'moderation.rejectionReason': notes || 'Rejected by moderator',
        },
      });
    } else if (decision === 'REQUEST_CHANGES') {
      await PropertyModel.findByIdAndUpdate(task.entityId, {
        $set: {
          status: 'DRAFT',
          'moderation.reviewerId': reviewerId,
          'moderation.reviewNotes': notes,
        },
      });
    }
  }

  // Emit event
  const producer = await getProducer();
  await producer.publish(
    TOPICS.MODERATION,
    EVENT_TYPES.MODERATION.TASK_DECIDED,
    {
      taskId,
      entityType: task.entityType,
      entityId: task.entityId,
      decision,
      reviewedBy: reviewerId,
      reviewedAt: updatedTask.reviewedAt.toISOString(),
    },
    { key: taskId }
  );

  return updatedTask;
}

/**
 * Get moderation statistics
 */
async function getStats() {
  const [pending, claimed, completed, autoApproved, autoRejected] = await Promise.all([
    prisma.moderationTask.count({ where: { status: 'PENDING' } }),
    prisma.moderationTask.count({ where: { status: 'CLAIMED' } }),
    prisma.moderationTask.count({ where: { status: 'COMPLETED' } }),
    prisma.moderationTask.count({
      where: {
        autoScore: { gte: 80 },
        status: 'COMPLETED',
      },
    }),
    prisma.moderationTask.count({
      where: {
        autoScore: { lte: 30 },
        status: 'COMPLETED',
      },
    }),
  ]);

  return {
    pending,
    claimed,
    completed,
    autoApproved,
    autoRejected,
    total: pending + claimed + completed,
  };
}

/**
 * List blacklist entries
 */
async function listBlacklist(filters = {}, options = {}) {
  const where = {};

  if (filters.entryType) {
    where.entryType = filters.entryType;
  }
  if (filters.severity) {
    where.severity = filters.severity;
  }

  // Filter expired entries
  where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];

  const { limit = 50, offset = 0 } = options;

  const [entries, total] = await Promise.all([
    prisma.blacklistEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.blacklistEntry.count({ where }),
  ]);

  return {
    entries,
    total,
    limit,
    offset,
  };
}

module.exports = {
  createTask,
  processPropertySubmission,
  getQueue,
  getTask,
  claimTask,
  releaseTask,
  makeDecision,
  getStats,
  listBlacklist,
};
