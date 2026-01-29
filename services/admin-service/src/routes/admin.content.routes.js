'use strict';

const { authMiddleware } = require('@real-estate/common');
const express = require('express');

const contentController = require('../controllers/content.controller');

const router = express.Router();

router.use(authMiddleware({ roles: ['ADMIN'] }));

router.get('/pages', contentController.adminListPages);
router.post('/pages', contentController.adminCreatePage);
router.get('/pages/:pageId', contentController.adminGetPage);
router.patch('/pages/:pageId', contentController.adminUpdatePage);
router.delete('/pages/:pageId', contentController.adminDeletePage);

router.get('/banners', contentController.adminListBanners);
router.post('/banners', contentController.adminCreateBanner);
router.patch('/banners/:bannerId', contentController.adminUpdateBanner);
router.delete('/banners/:bannerId', contentController.adminDeleteBanner);

router.get('/seo', contentController.adminListSeo);
router.post('/seo', contentController.adminUpsertSeo);
router.delete('/seo/:slug', contentController.adminDeleteSeo);

module.exports = router;
