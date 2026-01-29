'use strict';

const { authMiddleware } = require('@real-estate/common');
const express = require('express');

const experimentsController = require('../controllers/experiments.controller');

const router = express.Router();

router.use(authMiddleware({ roles: ['ADMIN'] }));

router.get('/', experimentsController.adminList);
router.post('/', experimentsController.adminUpsert);
router.patch('/:key', experimentsController.adminUpsert);
router.delete('/:expId', experimentsController.adminDelete);

module.exports = router;
