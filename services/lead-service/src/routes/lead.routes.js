'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const leadController = require('../controllers/lead.controller');
const {
  validateCreateLead,
  validateUpdateLeadStatus,
  validateAssignLead,
  validateAddNote,
  validateCreateAppointment,
  validateUpdateAppointment,
  validateCancelAppointment,
  validateIdParam,
  validateListLeadsQuery,
} = require('../validators/lead.validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Lead CRUD
router.post('/', validateCreateLead, leadController.createLead);
router.get('/', validateListLeadsQuery, leadController.listLeads);
router.get('/:id', validateIdParam, leadController.getLead);
router.patch('/:id', validateIdParam, validateUpdateLeadStatus, leadController.updateLeadStatus);

// Lead operations
router.post('/:id/assign', validateIdParam, validateAssignLead, leadController.assignLead);
router.post('/:id/spam', validateIdParam, leadController.markSpam);
router.post('/:id/unspam', validateIdParam, leadController.unmarkSpam);

// Notes
router.post('/:id/notes', validateIdParam, validateAddNote, leadController.addNote);
router.get('/:id/notes', validateIdParam, leadController.listNotes);

// Appointments
router.post(
  '/:id/appointment',
  validateIdParam,
  validateCreateAppointment,
  leadController.createAppointment
);
router.get('/:id/appointment', validateIdParam, leadController.getAppointment);
router.patch(
  '/:id/appointment',
  validateIdParam,
  validateUpdateAppointment,
  leadController.updateAppointment
);
router.delete(
  '/:id/appointment',
  validateIdParam,
  validateCancelAppointment,
  leadController.cancelAppointment
);

// Callback requests
router.post('/:id/call/request', validateIdParam, leadController.requestCallback);

// Metrics
router.get('/metrics/summary', leadController.getMetrics);

module.exports = router;
