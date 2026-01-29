'use strict';

const { httpStatus } = require('@real-estate/common');

const leadService = require('../services/lead.service');

/**
 * Create lead
 */
async function createLead(req, res, next) {
  try {
    const lead = await leadService.createLead(req.body);
    res.status(httpStatus.CREATED).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get lead
 */
async function getLead(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const lead = await leadService.getLead(id, userId);
    res.status(httpStatus.OK).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List leads
 */
async function listLeads(req, res, next) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const filters = {};
    if (userRole === 'AGENT' || userRole === 'BUILDER') {
      filters.sellerId = userId;
      if (req.user.orgId) {
        filters.orgId = req.user.orgId;
      }
    } else {
      filters.buyerId = userId;
    }

    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.source) {
      filters.source = req.query.source;
    }
    if (req.query.assignedToId) {
      filters.assignedToId = req.query.assignedToId;
    }

    const options = {
      limit: parseInt(req.query.limit, 10) || 20,
      offset: parseInt(req.query.offset, 10) || 0,
    };

    const result = await leadService.listLeads(filters, options);

    res.status(httpStatus.OK).json({
      success: true,
      data: result.leads,
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
 * Update lead status
 */
async function updateLeadStatus(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { status, ...metadata } = req.body;

    const lead = await leadService.updateLeadStatus(id, userId, status, metadata);

    res.status(httpStatus.OK).json({
      success: true,
      data: lead,
      message: 'Lead status updated',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Assign lead
 */
async function assignLead(req, res, next) {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;
    const assignedBy = req.user.id;

    const lead = await leadService.assignLead(id, assignedToId, assignedBy);

    res.status(httpStatus.OK).json({
      success: true,
      data: lead,
      message: 'Lead assigned successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add note
 */
async function addNote(req, res, next) {
  try {
    const { id } = req.params;
    const { content, isInternal } = req.body;
    const authorId = req.user.id;

    const note = await leadService.addNote(id, authorId, content, isInternal);

    res.status(httpStatus.CREATED).json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List notes
 */
async function listNotes(req, res, next) {
  try {
    const { id } = req.params;
    const includeInternal = req.query.includeInternal === 'true';

    const notes = await leadService.listNotes(id, includeInternal);

    res.status(httpStatus.OK).json({
      success: true,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark spam
 */
async function markSpam(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const lead = await leadService.markSpam(id, userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: lead,
      message: 'Lead marked as spam',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Unmark spam
 */
async function unmarkSpam(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const lead = await leadService.unmarkSpam(id, userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: lead,
      message: 'Lead unmarked as spam',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create appointment
 */
async function createAppointment(req, res, next) {
  try {
    const { id } = req.params;
    const createdById = req.user.id;

    const appointment = await leadService.createAppointment(id, req.body, createdById);

    res.status(httpStatus.CREATED).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get appointment
 */
async function getAppointment(req, res, next) {
  try {
    const { id } = req.params;
    const appointment = await leadService.getAppointment(id);

    res.status(httpStatus.OK).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update appointment
 */
async function updateAppointment(req, res, next) {
  try {
    const { id: _id } = req.params;
    const { appointmentId, ...data } = req.body;
    const userId = req.user.id;

    const appointment = await leadService.updateAppointment(appointmentId, data, userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel appointment
 */
async function cancelAppointment(req, res, next) {
  try {
    const { id: _id } = req.params;
    const { appointmentId } = req.body;
    const userId = req.user.id;

    const appointment = await leadService.cancelAppointment(appointmentId, userId);

    res.status(httpStatus.OK).json({
      success: true,
      data: appointment,
      message: 'Appointment cancelled',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get metrics
 */
async function getMetrics(req, res, next) {
  try {
    const userId = req.user.id;
    const orgId = req.user.orgId || null;

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const metrics = await leadService.getMetrics(userId, orgId, filters);

    res.status(httpStatus.OK).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Request a callback
 */
async function requestCallback(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { preferredTime, notes } = req.body || {};

    const result = await leadService.requestCallback(id, userId, {
      preferredTime: preferredTime || null,
      notes: notes || null,
      requestedAt: new Date().toISOString(),
    });

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
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
