'use strict';

const { internalAuth } = require('../internal-auth');

function mockReq(headers = {}) {
  return { headers };
}
function mockRes() {
  return {};
}

describe('internalAuth middleware', () => {
  const token = 'secret';

  beforeAll(() => {
    process.env.INTERNAL_API_TOKEN = token;
  });

  it('allows valid internal token', (done) => {
    const req = mockReq({ 'x-internal-token': token });
    const res = mockRes();
    const next = (err) => {
      expect(err).toBeUndefined();
      done();
    };
    internalAuth()(req, res, next);
  });

  it('rejects missing/invalid token', (done) => {
    const req = mockReq({});
    const res = mockRes();
    const next = (err) => {
      expect(err).toBeDefined();
      done();
    };
    internalAuth()(req, res, next);
  });
});
