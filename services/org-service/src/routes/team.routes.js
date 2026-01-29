'use strict';

const express = require('express');

const teamController = require('../controllers/team.controller');

const router = express.Router();

router.get('/:orgId/teams', teamController.listTeams);
router.post('/:orgId/teams', teamController.createTeam);
router.get('/:orgId/teams/:teamId', teamController.getTeam);
router.patch('/:orgId/teams/:teamId', teamController.updateTeam);
router.delete('/:orgId/teams/:teamId', teamController.deleteTeam);

module.exports = router;
