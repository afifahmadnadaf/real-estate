'use strict';

const { authMiddleware } = require('@real-estate/common');
const express = require('express');

const botController = require('../controllers/bot.controller');

const router = express.Router();
router.use(authMiddleware({ roles: ['ADMIN'] }));

router.get('/blocked', botController.listBlocked);

module.exports = router;

