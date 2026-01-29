'use strict';

const { authMiddleware } = require('@real-estate/common');
const express = require('express');

const supportController = require('../controllers/support.controller');

const router = express.Router();
router.use(authMiddleware({ roles: ['ADMIN'] }));

router.get('/tickets', supportController.adminListTickets);
router.patch('/tickets/:ticketId', supportController.adminUpdateTicket);

module.exports = router;

