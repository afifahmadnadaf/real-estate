'use strict';

const express = require('express');

const contentController = require('../controllers/content.controller');

const router = express.Router();

router.get('/home', contentController.getHome);
router.get('/faq', contentController.getFaq);
router.get('/blog', contentController.listBlog);
router.get('/blog/:slug', contentController.getBlog);
router.get('/banners', contentController.listBanners);

module.exports = router;
