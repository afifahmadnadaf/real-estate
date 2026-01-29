'use strict';

const { httpStatus } = require('@real-estate/common');

async function listBlocked(req, res, next) {
  try {
    res.status(httpStatus.OK).json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listBlocked,
};

