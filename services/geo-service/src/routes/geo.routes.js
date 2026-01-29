'use strict';

const { authenticate } = require('@real-estate/common');
const express = require('express');

const geoController = require('../controllers/geo.controller');

const router = express.Router();

// Public routes
router.get('/countries', geoController.listCountries);
router.get('/states', geoController.listStates);
router.get('/cities', geoController.listCities);
router.get('/cities/:id', geoController.getCity);
router.get('/localities', geoController.listLocalities);
router.get('/localities/:id', geoController.getLocality);
router.get('/localities/:id/polygon', geoController.getLocalityPolygon);
router.get('/geocode', geoController.geocode);
router.get('/reverse-geocode', geoController.reverseGeocode);
router.get('/nearby', geoController.getNearbyPois);
router.get('/pois', geoController.listPois);
router.get('/pois/:poiId', geoController.getPoi);
router.get('/clusters', geoController.getClusters);

// Admin routes
router.use('/admin', authenticate);
router.post('/admin/cities', geoController.createCity);
router.patch('/admin/cities/:id', geoController.updateCity);
router.post('/admin/localities', geoController.createLocality);
router.patch('/admin/localities/:id', geoController.updateLocality);
router.post('/admin/pois', geoController.createPoi);
router.patch('/admin/pois/:id', geoController.updatePoi);

module.exports = router;
