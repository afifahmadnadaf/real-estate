'use strict';

const express = require('express');

const blacklistController = require('../controllers/blacklist.controller');

const router = express.Router();

router.get('/', blacklistController.listEntries);
router.get('/:entryId', blacklistController.getEntry);
router.post('/', blacklistController.createEntry);
router.patch('/:entryId', blacklistController.updateEntry);
router.delete('/:entryId', blacklistController.deleteEntry);

module.exports = router;
