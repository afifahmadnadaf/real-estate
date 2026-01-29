'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const rulesController = require('../controllers/rules.controller');
const {
  validateRuleIdParam,
  validateCreateRule,
  validateUpdateRule,
  validateListRulesQuery,
} = require('../validators/moderation.validator');

const router = express.Router();

// All routes require authentication (admin)
router.use(authenticate);

// Rules CRUD
router.get('/', validateListRulesQuery, rulesController.listRules);
router.post('/', validateCreateRule, rulesController.createRule);
router.patch('/:id', validateRuleIdParam, validateUpdateRule, rulesController.updateRule);
router.delete('/:id', validateRuleIdParam, rulesController.deleteRule);

module.exports = router;
