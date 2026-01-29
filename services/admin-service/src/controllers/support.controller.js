'use strict';

const { AppError, errorCodes, httpStatus } = require('@real-estate/common');
const { prisma } = require('@real-estate/db-models');

function requireUserId(req) {
  const userId = req.user?.id || req.headers['x-user-id'];
  if (!userId) {
    throw new AppError('Unauthorized', 401, errorCodes.AUTH.TOKEN_INVALID);
  }
  return String(userId);
}

async function createTicket(req, res, next) {
  try {
    const userId = requireUserId(req);
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: req.body?.subject,
        description: req.body?.description,
        priority: req.body?.priority || 'MEDIUM',
        metadata: req.body?.metadata || null,
      },
    });
    res.status(httpStatus.CREATED).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
}

async function listMyTickets(req, res, next) {
  try {
    const userId = requireUserId(req);
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(req.query.limit, 10) || 50,
      skip: parseInt(req.query.offset, 10) || 0,
    });
    res.status(httpStatus.OK).json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
}

async function getMyTicket(req, res, next) {
  try {
    const userId = requireUserId(req);
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.ticketId },
      include: { messages: true },
    });
    if (!ticket || ticket.userId !== userId) {
      throw new AppError('Ticket not found', 404, errorCodes.RESOURCE.NOT_FOUND);
    }
    res.status(httpStatus.OK).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
}

async function updateMyTicket(req, res, next) {
  try {
    const userId = requireUserId(req);
    const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.ticketId } });
    if (!ticket || ticket.userId !== userId) {
      throw new AppError('Ticket not found', 404, errorCodes.RESOURCE.NOT_FOUND);
    }
    const updated = await prisma.supportTicket.update({
      where: { id: req.params.ticketId },
      data: {
        subject: req.body?.subject,
        description: req.body?.description,
        status: req.body?.status,
        priority: req.body?.priority,
        metadata: req.body?.metadata,
      },
    });
    res.status(httpStatus.OK).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

async function adminListTickets(req, res, next) {
  try {
    const where = {};
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.userId) where.userId = String(req.query.userId);
    const tickets = await prisma.supportTicket.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: { createdAt: 'desc' },
      take: parseInt(req.query.limit, 10) || 100,
      skip: parseInt(req.query.offset, 10) || 0,
    });
    res.status(httpStatus.OK).json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
}

async function adminUpdateTicket(req, res, next) {
  try {
    const updated = await prisma.supportTicket.update({
      where: { id: req.params.ticketId },
      data: {
        status: req.body?.status,
        priority: req.body?.priority,
        metadata: req.body?.metadata,
      },
    });
    res.status(httpStatus.OK).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTicket,
  listMyTickets,
  getMyTicket,
  updateMyTicket,
  adminListTickets,
  adminUpdateTicket,
};

