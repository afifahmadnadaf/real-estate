'use strict';

const { authMiddleware } = require('@real-estate/common');
const express = require('express');

const flagsController = require('../controllers/flags.controller');

const router = express.Router();

router.use(authMiddleware({ roles: ['ADMIN'] }));

router.get('/', flagsController.listFlags);
router.get('/:key', flagsController.getFlag);
router.post('/', flagsController.upsertFlag);
router.patch('/:key', flagsController.upsertFlag);
router.delete('/:key', flagsController.deleteFlag);

module.exports = router;
