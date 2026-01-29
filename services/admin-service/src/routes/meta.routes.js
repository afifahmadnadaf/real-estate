'use strict';

const express = require('express');

const metaController = require('../controllers/meta.controller');

const router = express.Router();

router.get('/property-types', (req, res, next) => {
  req.params.category = 'property-types';
  return metaController.listCategory(req, res, next);
});
router.get('/amenities', (req, res, next) => {
  req.params.category = 'amenities';
  return metaController.listCategory(req, res, next);
});
router.get('/furnishing', (req, res, next) => {
  req.params.category = 'furnishing';
  return metaController.listCategory(req, res, next);
});
router.get('/facing', (req, res, next) => {
  req.params.category = 'facing';
  return metaController.listCategory(req, res, next);
});
router.get('/ownership-types', (req, res, next) => {
  req.params.category = 'ownership-types';
  return metaController.listCategory(req, res, next);
});
router.get('/availability', (req, res, next) => {
  req.params.category = 'availability';
  return metaController.listCategory(req, res, next);
});
router.get('/sort-options', (req, res, next) => {
  req.params.category = 'sort-options';
  return metaController.listCategory(req, res, next);
});

module.exports = router;
