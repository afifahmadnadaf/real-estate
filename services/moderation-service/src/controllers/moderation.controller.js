'use strict';

const { httpStatus } = require('@real-estate/common');

const moderationService = require('../services/moderation.service');

/**
 * Get moderation queue
 */
async function getQueue(req, res, next) {
  try {
    const filters = {
      status: req.query.status || 'PENDING',
      taskType: req.query.taskType,
      priority: req.query.priority,
    };

    const options = {
      limit: parseInt(req.query.limit, 10) || 50,
      offset: parseInt(req.query.offset, 10) || 0,
    };

    const result = await moderationService.getQueue(filters, options);

    res.status(httpStatus.OK).json({
      success: true,
      data: result.tasks,
      meta: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get task by ID
 */
async function getTask(req, res, next) {
  try {
    const { taskId } = req.params;
    const task = await moderationService.getTask(taskId);

    res.status(httpStatus.OK).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Claim task
 */
async function claimTask(req, res, next) {
  try {
    const { taskId } = req.params;
    const reviewerId = req.user.id;

    const task = await moderationService.claimTask(taskId, reviewerId);

    res.status(httpStatus.OK).json({
      success: true,
      data: task,
      message: 'Task claimed successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Release task
 */
async function releaseTask(req, res, next) {
  try {
    const { taskId } = req.params;
    const reviewerId = req.user.id;

    const task = await moderationService.releaseTask(taskId, reviewerId);

    res.status(httpStatus.OK).json({
      success: true,
      data: task,
      message: 'Task released successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Make decision on task
 */
async function makeDecision(req, res, next) {
  try {
    const { taskId } = req.params;
    const reviewerId = req.user.id;
    const { decision, notes } = req.body;

    const task = await moderationService.makeDecision(taskId, reviewerId, decision, notes);

    res.status(httpStatus.OK).json({
      success: true,
      data: task,
      message: 'Decision recorded successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add comment to task
 */
async function addComment(req, res, next) {
  try {
    const { taskId } = req.params;
    const { comment } = req.body;

    // For now, update review notes (can be extended to separate comments table)
    const task = await moderationService.getTask(taskId);
    const updatedNotes = task.reviewNotes
      ? `${task.reviewNotes}\n\n[${new Date().toISOString()}] ${comment}`
      : comment;

    const updatedTask = await moderationService.makeDecision(
      taskId,
      req.user.id,
      task.reviewDecision || null,
      updatedNotes
    );

    res.status(httpStatus.OK).json({
      success: true,
      data: updatedTask,
      message: 'Comment added successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get moderation statistics
 */
async function getStats(req, res, next) {
  try {
    const stats = await moderationService.getStats();

    res.status(httpStatus.OK).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List blacklist entries (admin)
 */
async function listBlacklist(req, res, next) {
  try {
    const filters = {
      entryType: req.query.entryType,
      severity: req.query.severity,
    };

    const options = {
      limit: parseInt(req.query.limit, 10) || 50,
      offset: parseInt(req.query.offset, 10) || 0,
    };

    const result = await moderationService.listBlacklist(filters, options);

    res.status(httpStatus.OK).json({
      success: true,
      data: result.entries,
      meta: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getQueue,
  getTask,
  claimTask,
  releaseTask,
  makeDecision,
  addComment,
  getStats,
  listBlacklist,
};
