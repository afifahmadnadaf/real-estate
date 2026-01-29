'use strict';

const { execSync } = require('child_process');
const path = require('path');

describe('endpoint spec alignment', () => {
  it('exposes all implemented spec endpoints via api-gateway', () => {
    const repoRoot = path.resolve(__dirname, '..', '..', '..');
    const out = execSync('node .\\scripts\\endpoint-audit.js', { cwd: repoRoot, encoding: 'utf8' });
    const result = JSON.parse(out);
    expect(Array.isArray(result.specImplementedButNotExposed)).toBe(true);
    expect(result.specImplementedButNotExposed).toHaveLength(0);
  });

  it('keeps critical v1.1 endpoints implemented', () => {
    const repoRoot = path.resolve(__dirname, '..', '..', '..');
    const out = execSync('node .\\scripts\\endpoint-audit.js', { cwd: repoRoot, encoding: 'utf8' });
    const result = JSON.parse(out);

    const missing = new Set(result.missingInCode || []);
    const mustNotBeMissing = [
      'POST /v1/projects/{param}/media',
      'PATCH /v1/projects/{param}/media/order',
      'DELETE /v1/projects/{param}/media/{param}',
      'POST /v1/projects/{param}/brochure',
      'PATCH /v1/reviews/{param}',
      'DELETE /v1/reviews/{param}',
      'GET /v1/admin/blacklist/{param}',
      'POST /v1/admin/fraud/score/recompute',
      'POST /v1/webhooks/shiprocket',
      'GET /v1/experiments',
      'POST /v1/experiments/exposure',
      'POST /v1/admin/bulk/import/properties',
      'GET /v1/support/tickets',
    ];

    for (const k of mustNotBeMissing) {
      expect(missing.has(k)).toBe(false);
    }
  });
});

