'use strict';

const { authMiddleware } = require('@real-estate/common');
const express = require('express');

const supportController = require('../controllers/support.controller');

const router = express.Router();
router.use(authMiddleware());

router.post('/tickets', supportController.createTicket);
router.get('/tickets', supportController.listMyTickets);
router.get('/tickets/:ticketId', supportController.getMyTicket);
router.patch('/tickets/:ticketId', supportController.updateMyTicket);

module.exports = router;

