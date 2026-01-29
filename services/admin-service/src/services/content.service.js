'use strict';

const { AppError, errorCodes } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

async function getContentByType(type) {
  const page = await prisma.contentPage.findFirst({
    where: { type, isActive: true },
    orderBy: { updatedAt: 'desc' },
  });
  if (!page) {
    throw new AppError('Content not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }
  return page;
}

async function listBlogPosts(filters = {}) {
  return prisma.contentPage.findMany({
    where: { type: 'BLOG', isActive: true },
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 20,
    skip: filters.offset || 0,
    select: {
      id: true,
      slug: true,
      title: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function getBlogBySlug(slug) {
  const page = await prisma.contentPage.findFirst({
    where: { type: 'BLOG', slug, isActive: true },
  });
  if (!page) {
    throw new AppError('Content not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }
  return page;
}

async function listBanners(filters = {}) {
  const where = { isActive: true };
  if (filters.position) {
    where.position = filters.position;
  }
  return prisma.banner.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
}

async function listSeoLanding(type) {
  return prisma.seoLandingPage.findMany({
    where: { type, isActive: true },
    orderBy: { updatedAt: 'desc' },
  });
}

async function getSeoBySlug(slug) {
  const page = await prisma.seoLandingPage.findFirst({
    where: { slug, isActive: true },
  });
  if (!page) {
    throw new AppError('SEO page not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }
  return page;
}

async function adminListPages(filters = {}) {
  const where = {};
  if (filters.type) {
    where.type = filters.type;
  }
  return prisma.contentPage.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: filters.limit || 100,
    skip: filters.offset || 0,
  });
}

async function adminGetPage(id) {
  const page = await prisma.contentPage.findUnique({ where: { id } });
  if (!page) {
    throw new AppError('Content not found', 404, errorCodes.RESOURCE.NOT_FOUND);
  }
  return page;
}

async function adminCreatePage(data) {
  return prisma.contentPage.create({
    data: {
      type: data.type,
      slug: data.slug,
      title: data.title,
      body: data.body || null,
      metadata: data.metadata || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });
}

async function adminUpdatePage(id, data) {
  return prisma.contentPage.update({
    where: { id },
    data: {
      type: data.type,
      slug: data.slug,
      title: data.title,
      body: data.body,
      metadata: data.metadata,
      isActive: data.isActive,
    },
  });
}

async function adminDeletePage(id) {
  await prisma.contentPage.delete({ where: { id } });
  return { success: true };
}

async function adminListBanners() {
  return prisma.banner.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
}

async function adminCreateBanner(data) {
  return prisma.banner.create({
    data: {
      title: data.title,
      imageUrl: data.imageUrl,
      linkUrl: data.linkUrl || null,
      position: data.position || null,
      sortOrder: data.sortOrder || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      metadata: data.metadata || null,
    },
  });
}

async function adminUpdateBanner(id, data) {
  return prisma.banner.update({
    where: { id },
    data: {
      title: data.title,
      imageUrl: data.imageUrl,
      linkUrl: data.linkUrl,
      position: data.position,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      startsAt: data.startsAt ? new Date(data.startsAt) : data.startsAt === null ? null : undefined,
      endsAt: data.endsAt ? new Date(data.endsAt) : data.endsAt === null ? null : undefined,
      metadata: data.metadata,
    },
  });
}

async function adminDeleteBanner(id) {
  await prisma.banner.delete({ where: { id } });
  return { success: true };
}

async function adminListSeo(filters = {}) {
  const where = {};
  if (filters.type) {
    where.type = filters.type;
  }
  return prisma.seoLandingPage.findMany({ where, orderBy: { updatedAt: 'desc' } });
}

async function adminUpsertSeo(data) {
  return prisma.seoLandingPage.upsert({
    where: { slug: data.slug },
    update: {
      type: data.type,
      title: data.title,
      content: data.content,
      cityId: data.cityId || null,
      localityId: data.localityId || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
    create: {
      type: data.type,
      slug: data.slug,
      title: data.title || null,
      content: data.content || {},
      cityId: data.cityId || null,
      localityId: data.localityId || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });
}

async function adminDeleteSeo(slug) {
  await prisma.seoLandingPage.delete({ where: { slug } });
  return { success: true };
}

module.exports = {
  getContentByType,
  listBlogPosts,
  getBlogBySlug,
  listBanners,
  listSeoLanding,
  getSeoBySlug,
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
