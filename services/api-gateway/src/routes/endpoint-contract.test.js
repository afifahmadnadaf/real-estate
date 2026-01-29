'use strict';

const fs = require('fs');
const path = require('path');

const {
  buildServiceEndpoints,
  parseSpecEndpoints,
  computeGaps,
  extractGatewayStaticRoutes,
  extractGatewayAdminDispatchRoutes,
  isGatewayExposed,
  normalizeMethod,
  normalizePath,
} = require('../../../../scripts/endpoint-audit');

function indexKeys(endpoints) {
  const set = new Set();
  for (const ep of endpoints) {
    set.add(`${normalizeMethod(ep.method)} ${normalizePath(ep.path)}`);
  }
  return set;
}

function extractAppDirectEndpoints(appSourceText) {
  const endpoints = [];
  const re = /\bapp\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(appSourceText))) {
    endpoints.push({ method: normalizeMethod(m[1]), path: normalizePath(m[2]) });
  }
  return endpoints;
}

describe('endpoint contract safety (static, no services)', () => {
  it('does not implement the same v1 endpoint in multiple services', () => {
    const repoRoot = path.resolve(__dirname, '../../../..');
    const byService = buildServiceEndpoints({ servicesDir: path.join(repoRoot, 'services') });
    const codeEndpoints = Object.values(byService).flat();

    const map = new Map();
    for (const ep of codeEndpoints) {
      if (ep.service === 'api-gateway') continue;
      const p = normalizePath(ep.path);
      if (!p.startsWith('/v1/')) continue;
      const key = `${normalizeMethod(ep.method)} ${p}`;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(ep.service);
    }

    const collisions = [];
    for (const [key, services] of map.entries()) {
      if (services.size > 1) collisions.push({ key, services: Array.from(services).sort() });
    }

    expect(collisions).toEqual([]);
  });

  it('exposes all spec-implemented v1 endpoints through the gateway (static check)', () => {
    const repoRoot = path.resolve(__dirname, '../../../..');
    const servicesDir = path.join(repoRoot, 'services');
    const specPath = path.join(repoRoot, 'Real_Estate_All_API_Endpoints_v1_1.md');
    const gatewayRoutesPath = path.join(repoRoot, 'services', 'api-gateway', 'src', 'routes', 'index.js');
    const gatewayAppPath = path.join(repoRoot, 'services', 'api-gateway', 'src', 'app.js');

    const byService = buildServiceEndpoints({ servicesDir });
    const codeEndpoints = Object.values(byService).flat().map((e) => ({ method: e.method, path: e.path }));
    const specEndpoints = parseSpecEndpoints(specPath);

    const { missingInCode } = computeGaps({ specEndpoints, codeEndpoints });
    const specKeys = indexKeys(specEndpoints);
    const codeKeys = indexKeys(codeEndpoints);

    const implementedSpec = [];
    for (const key of specKeys) {
      if (codeKeys.has(key)) implementedSpec.push(key);
    }

    const gatewayText = fs.readFileSync(gatewayRoutesPath, 'utf8');
    const gatewayAppText = fs.readFileSync(gatewayAppPath, 'utf8');
    const staticRoutes = extractGatewayStaticRoutes(gatewayText).filter((r) => r.path !== '/admin');
    const adminDispatch = extractGatewayAdminDispatchRoutes(gatewayText);
    const appDirect = extractAppDirectEndpoints(gatewayAppText);

    const gatewayRoutes = [
      ...appDirect.map((r) => ({ method: r.method, path: r.path })),
      { method: 'ANY', path: '/internal/v1' },
      ...staticRoutes.map((r) => ({ method: r.method, path: normalizePath(`/v1${r.path}`) })),
      ...adminDispatch.map((r) => ({ method: r.method, path: normalizePath(`/v1${r.path}`) })),
    ];

    const notExposed = [];
    for (const key of implementedSpec) {
      const [method, p] = key.split(' ', 2);
      if (!isGatewayExposed(gatewayRoutes, method, p)) {
        notExposed.push(key);
      }
    }

    expect(missingInCode).toBeDefined();
    expect(notExposed).toEqual([]);
  });
});

