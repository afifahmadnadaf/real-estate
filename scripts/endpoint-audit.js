'use strict';

const fs = require('fs');
const path = require('path');

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function listFilesRecursive(rootDir, predicate) {
  const out = [];
  const stack = [rootDir];
  while (stack.length) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        stack.push(full);
      } else if (e.isFile()) {
        if (!predicate || predicate(full)) out.push(full);
      }
    }
  }
  return out;
}

function normalizePath(p) {
  let s = String(p || '').trim();
  if (!s.startsWith('/')) s = `/${s}`;
  s = s.replace(/\/+/g, '/');
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
  s = s.replace(/:([A-Za-z0-9_]+)/g, '{param}');
  s = s.replace(/\{[^}]+\}/g, '{param}');
  return s;
}

function normalizeMethod(m) {
  return String(m || '').trim().toUpperCase();
}

function joinPaths(a, b) {
  const left = normalizePath(a);
  const right = normalizePath(b);
  if (left === '/') return right;
  if (right === '/') return left;
  return normalizePath(`${left}/${right.replace(/^\//, '')}`);
}

function extractRequires(sourceText) {
  const requireMap = new Map();
  const re = /const\s+([A-Za-z0-9_$]+)\s*=\s*require\(\s*['"](.+?)['"]\s*\)\s*;/g;
  let m;
  while ((m = re.exec(sourceText))) {
    requireMap.set(m[1], m[2]);
  }
  return requireMap;
}

function extractAppMounts(appSourceText) {
  const mounts = [];
  const reVar = /app\.use\(\s*['"]([^'"]+)['"]\s*,\s*([A-Za-z0-9_$]+)\s*\)/g;
  const reRequire =
    /app\.use\(\s*['"]([^'"]+)['"]\s*,\s*require\(\s*['"](.+?)['"]\s*\)\s*\)/g;
  let m;
  while ((m = reVar.exec(appSourceText))) {
    mounts.push({ basePath: normalizePath(m[1]), routerVar: m[2], routerRequire: null });
  }
  while ((m = reRequire.exec(appSourceText))) {
    mounts.push({ basePath: normalizePath(m[1]), routerVar: null, routerRequire: m[2] });
  }
  return mounts;
}

function extractRouterEndpoints(routeSourceText) {
  const endpoints = [];
  const re = /\brouter\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(routeSourceText))) {
    endpoints.push({ method: normalizeMethod(m[1]), path: normalizePath(m[2]) });
  }
  return endpoints;
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

function extractGatewayStaticRoutes(gatewayRoutesText) {
  const routes = [];
  const re = /\brouter\.(use|get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(gatewayRoutesText))) {
    const verb = normalizeMethod(m[1]);
    routes.push({
      method: verb === 'USE' ? 'ANY' : verb,
      path: normalizePath(m[2]),
    });
  }
  return routes;
}

function extractGatewayAdminDispatchRoutes(gatewayRoutesText) {
  const routes = [];
  const reIf = /if\s*\(([\s\S]*?)\)\s*\{\s*return\s+createServiceProxy\(\s*config\.services\.[A-Za-z0-9_]+\s*(?:,\s*\{[\s\S]*?\})?\s*\)/g;
  let m;
  while ((m = reIf.exec(gatewayRoutesText))) {
    const cond = m[1] || '';
    const reStartsWith = /path\.startsWith\(\s*['"]\/([^'"]+)['"]\s*\)/g;
    let sm;
    while ((sm = reStartsWith.exec(cond))) {
      routes.push({ method: 'ANY', path: normalizePath(`/admin/${sm[1]}`) });
    }
  }
  return routes;
}

function isGatewayExposed(gatewayRoutes, method, fullPath) {
  const m = normalizeMethod(method);
  const p = normalizePath(fullPath);
  for (const r of gatewayRoutes) {
    if (r.method !== 'ANY' && r.method !== m) continue;
    if (p === r.path || p.startsWith(`${r.path}/`)) return true;
  }
  return false;
}

function buildServiceEndpoints({ servicesDir }) {
  const serviceDirs = fs
    .readdirSync(servicesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const byService = {};

  for (const serviceName of serviceDirs) {
    const serviceRoot = path.join(servicesDir, serviceName);
    const appPath = path.join(serviceRoot, 'src', 'app.js');
    if (!fs.existsSync(appPath)) continue;

    const appText = readText(appPath);
    const requireMap = extractRequires(appText);
    const mounts = extractAppMounts(appText);

    const routeEndpoints = [];

    const directEndpoints = extractAppDirectEndpoints(appText);
    for (const ep of directEndpoints) {
      routeEndpoints.push({
        method: ep.method,
        path: ep.path,
        service: serviceName,
        source: appPath,
      });
    }

    for (const mount of mounts) {
      const requireRel = mount.routerRequire || (mount.routerVar ? requireMap.get(mount.routerVar) : null);
      if (!requireRel) continue;

      const routerFile = path.resolve(path.dirname(appPath), requireRel);
      const routeFile = fs.existsSync(routerFile) && fs.statSync(routerFile).isDirectory()
        ? path.join(routerFile, 'index.js')
        : routerFile.endsWith('.js')
          ? routerFile
          : `${routerFile}.js`;
      if (!fs.existsSync(routeFile)) continue;

      const routeText = readText(routeFile);
      const endpoints = extractRouterEndpoints(routeText);

      for (const ep of endpoints) {
        routeEndpoints.push({
          method: ep.method,
          path: joinPaths(mount.basePath, ep.path),
          service: serviceName,
          source: routeFile,
        });
      }
    }

    byService[serviceName] = routeEndpoints;
  }

  return byService;
}

function parseSpecEndpoints(specPath) {
  const text = readText(specPath);
  const re = /`(GET|POST|PUT|PATCH|DELETE)\s+([^`\s]+)\s+—/g;
  const endpoints = [];
  let m;
  while ((m = re.exec(text))) {
    endpoints.push({
      method: normalizeMethod(m[1]),
      path: normalizePath(m[2]),
    });
  }
  return endpoints;
}

function indexEndpoints(endpoints) {
  const map = new Map();
  for (const ep of endpoints) {
    const key = `${normalizeMethod(ep.method)} ${normalizePath(ep.path)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(ep);
  }
  return map;
}

function computeGaps({ specEndpoints, codeEndpoints }) {
  const specIndex = indexEndpoints(specEndpoints);
  const codeIndex = indexEndpoints(codeEndpoints);

  const missingInCode = [];
  for (const key of specIndex.keys()) {
    if (!codeIndex.has(key)) missingInCode.push(key);
  }

  const extraInCode = [];
  for (const key of codeIndex.keys()) {
    if (!specIndex.has(key)) extraInCode.push(key);
  }

  missingInCode.sort();
  extraInCode.sort();

  return { missingInCode, extraInCode };
}

function formatMarkdownReport({ specCount, codeCount, missingInCode, extraInCode, specImplementedButNotExposed }) {
  const lines = [];
  lines.push('# Endpoint Gap Report');
  lines.push('');
  lines.push(`- Spec endpoints: ${specCount}`);
  lines.push(`- Implemented endpoints (code): ${codeCount}`);
  lines.push(`- Missing from code: ${missingInCode.length}`);
  lines.push(`- Extra in code (not in spec): ${extraInCode.length}`);
  lines.push(`- Implemented but not exposed via gateway: ${specImplementedButNotExposed.length}`);
  lines.push('');
  lines.push('## Missing From Code');
  if (!missingInCode.length) {
    lines.push('');
    lines.push('- None');
  } else {
    lines.push('');
    for (const k of missingInCode) lines.push(`- ${k}`);
  }
  lines.push('');
  lines.push('## Implemented But Not Exposed Via Gateway');
  if (!specImplementedButNotExposed.length) {
    lines.push('');
    lines.push('- None');
  } else {
    lines.push('');
    for (const k of specImplementedButNotExposed) lines.push(`- ${k}`);
  }
  lines.push('');
  lines.push('## Extra In Code');
  if (!extraInCode.length) {
    lines.push('');
    lines.push('- None');
  } else {
    lines.push('');
    for (const k of extraInCode) lines.push(`- ${k}`);
  }
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const servicesDir = path.join(repoRoot, 'services');
  const specPath = path.join(repoRoot, 'Real_Estate_All_API_Endpoints_v1_1.md');
  const gatewayRoutesPath = path.join(repoRoot, 'services', 'api-gateway', 'src', 'routes', 'index.js');
  const gatewayAppPath = path.join(repoRoot, 'services', 'api-gateway', 'src', 'app.js');

  const byService = buildServiceEndpoints({ servicesDir });
  const codeEndpoints = Object.values(byService).flat();
  const specEndpoints = parseSpecEndpoints(specPath);

  const { missingInCode, extraInCode } = computeGaps({ specEndpoints, codeEndpoints });

  const gatewayText = fs.existsSync(gatewayRoutesPath) ? readText(gatewayRoutesPath) : '';
  const gatewayV1Routes = extractGatewayStaticRoutes(gatewayText).filter((r) => r.path !== '/admin');
  const gatewayAdminDispatch = extractGatewayAdminDispatchRoutes(gatewayText);
  const gatewayAppText = fs.existsSync(gatewayAppPath) ? readText(gatewayAppPath) : '';
  const gatewayAppDirect = extractAppDirectEndpoints(gatewayAppText);

  const gatewayRoutes = [
    ...gatewayAppDirect.map((r) => ({ method: r.method, path: r.path })),
    { method: 'ANY', path: '/internal/v1' },
    ...gatewayV1Routes.map((r) => ({ method: r.method, path: normalizePath(`/v1${r.path}`) })),
    ...gatewayAdminDispatch.map((r) => ({ method: r.method, path: normalizePath(`/v1${r.path}`) })),
  ];

  const codeIndex = indexEndpoints(codeEndpoints);
  const specImplementedButNotExposed = [];
  for (const ep of specEndpoints) {
    const key = `${normalizeMethod(ep.method)} ${normalizePath(ep.path)}`;
    if (!codeIndex.has(key)) continue;
    if (!isGatewayExposed(gatewayRoutes, ep.method, ep.path)) specImplementedButNotExposed.push(key);
  }
  specImplementedButNotExposed.sort();

  const report = formatMarkdownReport({
    specCount: specEndpoints.length,
    codeCount: codeEndpoints.length,
    missingInCode,
    extraInCode,
    specImplementedButNotExposed,
  });

  const outPath = path.join(repoRoot, 'docs', 'ENDPOINT_GAP_REPORT.md');
  fs.writeFileSync(outPath, report, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        specCount: specEndpoints.length,
        codeCount: codeEndpoints.length,
        missingInCode,
        extraInCode,
        specImplementedButNotExposed,
        reportPath: outPath,
      },
      null,
      2
    )
  );
}

module.exports = {
  buildServiceEndpoints,
  parseSpecEndpoints,
  computeGaps,
  normalizePath,
  normalizeMethod,
  extractGatewayStaticRoutes,
  extractGatewayAdminDispatchRoutes,
  isGatewayExposed,
};

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(String(err && err.stack ? err.stack : err));
    process.exitCode = 1;
  });
}
