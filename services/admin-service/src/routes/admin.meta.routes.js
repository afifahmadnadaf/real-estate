'use strict';

const { authMiddleware } = require('@real-estate/common');
const express = require('express');

const metaController = require('../controllers/meta.controller');

const router = express.Router();

router.use(authMiddleware({ roles: ['ADMIN'] }));

function withCategory(category, handler) {
  return (req, res, next) => {
    req.params.category = category;
    return handler(req, res, next);
  };
}

router.get('/property-types', withCategory('property-types', metaController.adminList));
router.post('/property-types', withCategory('property-types', metaController.adminCreate));
router.patch('/property-types/:id', withCategory('property-types', metaController.adminUpdate));
router.delete('/property-types/:id', withCategory('property-types', metaController.adminDelete));

router.get('/amenities', withCategory('amenities', metaController.adminList));
router.post('/amenities', withCategory('amenities', metaController.adminCreate));
router.patch('/amenities/:id', withCategory('amenities', metaController.adminUpdate));
router.delete('/amenities/:id', withCategory('amenities', metaController.adminDelete));

router.get('/:category', metaController.adminList);
router.post('/:category', metaController.adminCreate);
router.patch('/:category/:id', metaController.adminUpdate);
router.delete('/:category/:id', metaController.adminDelete);

module.exports = router;
