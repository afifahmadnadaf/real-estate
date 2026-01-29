'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const templateController = require('../controllers/template.controller');
const {
  validateCreateTemplate,
  validateUpdateTemplate,
  validateIdParam,
} = require('../validators/notification.validator');

const router = express.Router();

// All routes require authentication (admin)
router.use(authenticate);

router.get('/', templateController.listTemplates);
router.get('/:id', validateIdParam, templateController.getTemplate);
router.post('/', validateCreateTemplate, templateController.createTemplate);
router.patch('/:id', validateIdParam, validateUpdateTemplate, templateController.updateTemplate);
router.delete('/:id', validateIdParam, templateController.deleteTemplate);

module.exports = router;
