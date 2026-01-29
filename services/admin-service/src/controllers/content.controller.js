'use strict';

const { httpStatus } = require('@real-estate/common');

const contentService = require('../services/content.service');

async function getHome(req, res, next) {
  try {
    const page = await contentService.getContentByType('HOME');
    res.status(httpStatus.OK).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
}

async function getFaq(req, res, next) {
  try {
    const page = await contentService.getContentByType('FAQ');
    res.status(httpStatus.OK).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
}

async function listBlog(req, res, next) {
  try {
    const posts = await contentService.listBlogPosts({
      limit: parseInt(req.query.limit, 10) || 20,
      offset: parseInt(req.query.offset, 10) || 0,
    });
    res.status(httpStatus.OK).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
}

async function getBlog(req, res, next) {
  try {
    const page = await contentService.getBlogBySlug(req.params.slug);
    res.status(httpStatus.OK).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
}

async function listBanners(req, res, next) {
  try {
    const banners = await contentService.listBanners({ position: req.query.position });
    res.status(httpStatus.OK).json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
}

async function listSeoCities(req, res, next) {
  try {
    const pages = await contentService.listSeoLanding('CITY');
    res.status(httpStatus.OK).json({ success: true, data: pages });
  } catch (error) {
    next(error);
  }
}

async function getSeoCity(req, res, next) {
  try {
    const page = await contentService.getSeoBySlug(req.params.citySlug);
    res.status(httpStatus.OK).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
}

async function getSeoLocality(req, res, next) {
  try {
    const page = await contentService.getSeoBySlug(req.params.localitySlug);
    res.status(httpStatus.OK).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
}

async function adminListPages(req, res, next) {
  try {
    const pages = await contentService.adminListPages({
      type: req.query.type,
      limit: parseInt(req.query.limit, 10) || 100,
      offset: parseInt(req.query.offset, 10) || 0,
    });
    res.status(httpStatus.OK).json({ success: true, data: pages });
  } catch (error) {
    next(error);
  }
}

async function adminGetPage(req, res, next) {
  try {
    const page = await contentService.adminGetPage(req.params.pageId);
    res.status(httpStatus.OK).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
}

async function adminCreatePage(req, res, next) {
  try {
    const page = await contentService.adminCreatePage(req.body);
    res.status(httpStatus.CREATED).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
}

async function adminUpdatePage(req, res, next) {
  try {
    const page = await contentService.adminUpdatePage(req.params.pageId, req.body);
    res.status(httpStatus.OK).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
}

async function adminDeletePage(req, res, next) {
  try {
    const result = await contentService.adminDeletePage(req.params.pageId);
    res.status(httpStatus.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function adminListBanners(req, res, next) {
  try {
    const banners = await contentService.adminListBanners();
    res.status(httpStatus.OK).json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
}

async function adminCreateBanner(req, res, next) {
  try {
    const banner = await contentService.adminCreateBanner(req.body);
    res.status(httpStatus.CREATED).json({ success: true, data: banner });
  } catch (error) {
    next(error);
  }
}

async function adminUpdateBanner(req, res, next) {
  try {
    const banner = await contentService.adminUpdateBanner(req.params.bannerId, req.body);
    res.status(httpStatus.OK).json({ success: true, data: banner });
  } catch (error) {
    next(error);
  }
}

async function adminDeleteBanner(req, res, next) {
  try {
    const result = await contentService.adminDeleteBanner(req.params.bannerId);
    res.status(httpStatus.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function adminListSeo(req, res, next) {
  try {
    const pages = await contentService.adminListSeo({ type: req.query.type });
    res.status(httpStatus.OK).json({ success: true, data: pages });
  } catch (error) {
    next(error);
  }
}

async function adminUpsertSeo(req, res, next) {
  try {
    const page = await contentService.adminUpsertSeo(req.body);
    res.status(httpStatus.OK).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
}

async function adminDeleteSeo(req, res, next) {
  try {
    const result = await contentService.adminDeleteSeo(req.params.slug);
    res.status(httpStatus.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHome,
  getFaq,
  listBlog,
  getBlog,
  listBanners,
  listSeoCities,
  getSeoCity,
  getSeoLocality,
  adminListPages,
  adminGetPage,
  adminCreatePage,
  adminUpdatePage,
  adminDeletePage,
  adminListBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,
  adminListSeo,
  adminUpsertSeo,
  adminDeleteSeo,
};
