'use strict';

const fs = require('fs');
const path = require('path');

function posixJoin(a, b) {
  const aa = (a || '').replace(/\\/g, '/').replace(/\/+$/, '');
  const bb = (b || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!aa) return `/${bb}`;
  if (!bb) return aa.startsWith('/') ? aa : `/${aa}`;
  return `${aa}/${bb}`.replace(/\/+/g, '/');
}

function normalizeDocPath(p) {
  return String(p || '')
    .replace(/\\/g, '/')
    .replace(/:([A-Za-z0-9_]+)/g, '{$1}')
    .replace(/\{param\}/g, '{param}')
    .replace(/\{[^}]+\}/g, '{param}');
}

function tryRead(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function listFilesRec(dir, predicate) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) {
        stack.push(p);
      } else if (!predicate || predicate(p)) {
        out.push(p);
      }
    }
  }
  return out;
}

function parseRequires(source) {
  const map = new Map();
  const re = /^\s*const\s+([A-Za-z0-9_$]+)\s*=\s*require\(\s*['"](.+?)['"]\s*\)\s*;/gm;
  let m;
  while ((m = re.exec(source))) {
    map.set(m[1], m[2]);
  }
  return map;
}

function parseAppMounts(appSource) {
  const mounts = [];
  const requireMap = parseRequires(appSource);

  const useRe =
    /^\s*app\.use\(\s*['"]([^'"]+)['"]\s*,\s*([A-Za-z0-9_$]+)\s*\)\s*;/gm;
  let m;
  while ((m = useRe.exec(appSource))) {
    const mountPath = m[1];
    const varName = m[2];
    mounts.push({ mountPath, varName, requirePath: requireMap.get(varName) || null });
  }

  const opRe = /^\s*app\.(get|post|patch|delete)\(\s*['"]([^'"]+)['"]/gm;
  while ((m = opRe.exec(appSource))) {
    mounts.push({ mountPath: m[2], method: m[1].toUpperCase(), operational: true });
  }

  return mounts;
}

function parseRouterFile(routerSource) {
  const endpoints = [];
  const methodRe =
    /router\.(get|post|patch|delete|put)\(\s*['"]([^'"]+)['"]([\s\S]*?)\)\s*;/g;
  let m;
  while ((m = methodRe.exec(routerSource))) {
    const method = m[1].toUpperCase();
    const routePath = m[2];
    const args = m[3] || '';
    const identRe = /([A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)*)/g;
    const idents = [];
    let im;
    while ((im = identRe.exec(args))) {
      idents.push(im[1]);
    }
    const handler = idents.length ? idents[idents.length - 1] : null;
    endpoints.push({ method, path: routePath, handler });
  }

  const useAuthRe = /^\s*router\.use\(\s*authenticate\b/gm;
  const usesAuthenticate = useAuthRe.test(routerSource);

  const internalAuthRe = /^\s*router\.use\(\s*internalAuth\b/gm;
  const usesInternalAuth = internalAuthRe.test(routerSource);

  return { endpoints, usesAuthenticate, usesInternalAuth };
}

function parseGatewayProxies(gatewayIndexSource) {
  const proxies = [];
  const useRe = /router\.use\(\s*['"]([^'"]+)['"]\s*,\s*createProxyMiddleware\(\s*\{([\s\S]*?)\}\s*\)\s*\)\s*;/g;
  let m;
  while ((m = useRe.exec(gatewayIndexSource))) {
    const mount = m[1];
    const body = m[2];
    const serviceUrlMatch = body.match(/target:\s*config\.[A-Za-z0-9_$]+\.(?:url|baseUrl)\s*\|\|\s*['"]([^'"]+)['"]/);
    const targetFallback = serviceUrlMatch ? serviceUrlMatch[1] : null;

    const rewritePairs = [];
    const pathRewriteBlock = body.match(/pathRewrite\s*:\s*\{([\s\S]*?)\}/);
    if (pathRewriteBlock) {
      const pairRe = /['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g;
      let p;
      while ((p = pairRe.exec(pathRewriteBlock[1]))) {
        rewritePairs.push({ from: p[1], to: p[2] });
      }
    }

    proxies.push({
      gatewayMount: mount,
      incomingPrefix: posixJoin('/v1', mount),
      rewritePairs,
      targetFallback,
      raw: body,
    });
  }

  const rewriteRe = /pathRewrite\s*:\s*\{([\s\S]*?)\}/g;
  while ((m = rewriteRe.exec(gatewayIndexSource))) {
    const block = m[1];
    const pairRe = /['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g;
    const rewritePairs = [];
    let p;
    while ((p = pairRe.exec(block))) {
      rewritePairs.push({ from: p[1], to: p[2] });
    }
    if (!rewritePairs.length) continue;
    proxies.push({
      gatewayMount: null,
      incomingPrefix: null,
      rewritePairs,
      targetFallback: null,
      raw: block,
    });
  }
  return proxies;
}

function parseGatewayAuthRules(gatewayIndexSource) {
  const prefixRules = [];
  const exactRules = [];

  const useBlockRe = /router\.use\(([\s\S]*?)\)\s*;/g;
  let m;
  while ((m = useBlockRe.exec(gatewayIndexSource))) {
    const block = m[1];
    const pathMatch = block.match(/['"]([^'"]+)['"]/);
    if (!pathMatch) continue;
    const mount = pathMatch[1];
    if (mount === '/admin') {
      prefixRules.push({ prefix: '/v1/admin', auth: 'admin' });
      continue;
    }
    const fullPrefix = posixJoin('/v1', mount);
    const auth =
      /authMiddleware\s*\(\s*\{[\s\S]*roles[\s\S]*\}\s*\)/.test(block) ? 'admin' :
      /authMiddleware\s*\(/.test(block) ? 'required' :
      /optionalAuth\s*\(/.test(block) ? 'optional' :
      mount.startsWith('/webhooks') ? 'public' :
      'public';
    prefixRules.push({ prefix: fullPrefix, auth });
  }

  const exactBlockRe = /router\.(get|post|patch|delete|put)\(([\s\S]*?)\)\s*;/g;
  while ((m = exactBlockRe.exec(gatewayIndexSource))) {
    const method = m[1].toUpperCase();
    const block = m[2];
    const pathMatch = block.match(/['"]([^'"]+)['"]/);
    if (!pathMatch) continue;
    const routePath = posixJoin('/v1', pathMatch[1]);
    const auth =
      /authMiddleware\s*\(/.test(block) ? 'required' :
      /optionalAuth\s*\(/.test(block) ? 'optional' :
      'public';
    exactRules.push({ method, path: routePath, auth });
  }

  prefixRules.sort((a, b) => b.prefix.length - a.prefix.length);
  return { prefixRules, exactRules };
}

function inferAuth({ method, gatewayPath, gatewayAuthRules, serviceName, serviceInternal, routerUsesAuthenticate }) {
  const gp = String(gatewayPath || '');
  if (gp.startsWith('/internal/')) return 'internal';
  if (gp.startsWith('/v1/admin/')) return 'admin';

  const norm = normalizeDocPath(gp);
  for (const r of gatewayAuthRules.exactRules) {
    if (r.method === String(method || '').toUpperCase() && normalizeDocPath(r.path) === norm) return r.auth;
  }
  for (const r of gatewayAuthRules.prefixRules) {
    if (norm.startsWith(normalizeDocPath(r.prefix))) return r.auth;
  }

  if (serviceName === 'admin-service') return 'admin';
  if (serviceInternal) return 'internal';
  if (routerUsesAuthenticate) return 'required';
  return 'public';
}

function inferPurpose({ method, gatewayPath }) {
  const p = String(gatewayPath);
  if (p.includes('/health')) return 'Health check';
  if (p.includes('/ready')) return 'Readiness check';
  if (p.includes('/metrics')) return 'Prometheus metrics';
  if (method === 'GET' && p.endsWith('/')) return 'List resources';
  if (method === 'GET') return 'Fetch resource';
  if (method === 'POST' && /\/submit$/.test(p)) return 'Submit for review';
  if (method === 'POST' && /\/publish$/.test(p)) return 'Publish';
  if (method === 'POST') return 'Create or action';
  if (method === 'PATCH' || method === 'PUT') return 'Update resource';
  if (method === 'DELETE') return 'Delete resource';
  return 'Endpoint';
}

function inferPurposeWithHandler({ method, gatewayPath, handler }) {
  const h = String(handler || '');
  const base = h.includes('.') ? h.split('.').pop() : h;
  const v = base.toLowerCase();
  if (v.startsWith('create')) return 'Create resource';
  if (v.startsWith('list')) return 'List resources';
  if (v.startsWith('get')) return 'Fetch resource';
  if (v.startsWith('update')) return 'Update resource';
  if (v.startsWith('delete') || v.startsWith('remove')) return 'Delete resource';
  if (v.startsWith('assign')) return 'Assign resource';
  if (v.startsWith('revoke')) return 'Revoke resource';
  if (v.includes('export')) return 'Export data';
  if (v.includes('import')) return 'Import data';
  if (v.includes('reindex')) return 'Reindex search';
  if (v.includes('validate')) return 'Validate request';
  if (v.includes('login')) return 'Login';
  if (v.includes('logout')) return 'Logout';
  if (v.includes('refresh')) return 'Refresh token';
  if (v.includes('otp')) return 'OTP flow';
  return inferPurpose({ method, gatewayPath });
}

function mapServicePathToGatewayPath(servicePath, proxyRules) {
  const sp = String(servicePath);
  let best = null;
  for (const pr of proxyRules) {
    for (const r of pr.rewritePairs) {
      const fromPrefix = r.from.replace(/^\^/, '');
      const toPrefix = r.to;
      if (!toPrefix) continue;
      if (sp.startsWith(toPrefix)) {
        if (!best || toPrefix.length > best.toPrefix.length) {
          best = { fromPrefix, toPrefix };
        }
      }
    }
  }
  if (best) {
    const rest = sp.slice(best.toPrefix.length);
    return `${best.fromPrefix}${rest}`.replace(/\/+/g, '/');
  }
  return sp.startsWith('/v1/') ? sp : null;
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const args = process.argv.slice(2);
  const outIndex = args.indexOf('--out');
  const outFile = outIndex >= 0 ? args[outIndex + 1] : null;
  const servicesDir = path.join(repoRoot, 'services');
  const docsDir = path.join(repoRoot, 'docs');
  const gatewayIndexPath = path.join(servicesDir, 'api-gateway', 'src', 'routes', 'index.js');
  const gatewayIndexSource = tryRead(gatewayIndexPath) || '';
  const proxyRules = parseGatewayProxies(gatewayIndexSource);
  const gatewayAuthRules = parseGatewayAuthRules(gatewayIndexSource);

  const inventory = [];

  const serviceNames = fs
    .readdirSync(servicesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) => n !== 'api-gateway');

  for (const serviceName of serviceNames) {
    const appPath = path.join(servicesDir, serviceName, 'src', 'app.js');
    const appSource = tryRead(appPath);
    if (!appSource) continue;

    const mounts = parseAppMounts(appSource);

    for (const m of mounts) {
      if (m.operational) {
        inventory.push({
          method: m.method,
          service: serviceName,
          servicePath: m.mountPath,
          gatewayPath: null,
          auth: inferAuth({
            method: m.method,
            gatewayPath: m.mountPath,
            gatewayAuthRules,
            serviceName,
            serviceInternal: false,
            routerUsesAuthenticate: false,
          }),
          purpose: inferPurpose({ method: m.method, gatewayPath: m.mountPath }),
          source: `${serviceName}:app.js`,
        });
        continue;
      }

      if (!m.requirePath) continue;
      const routerFile = path.resolve(path.dirname(appPath), `${m.requirePath}.js`);
      const routerSource = tryRead(routerFile);
      if (!routerSource) continue;

      const parsed = parseRouterFile(routerSource);
      for (const ep of parsed.endpoints) {
        const servicePath = posixJoin(m.mountPath, ep.path);
        const gw = mapServicePathToGatewayPath(servicePath, proxyRules) || servicePath;
        inventory.push({
          method: ep.method,
          service: serviceName,
          servicePath,
          gatewayPath: gw,
          auth: inferAuth({
            method: ep.method,
            gatewayPath: gw,
            gatewayAuthRules,
            serviceName,
            serviceInternal: parsed.usesInternalAuth,
            routerUsesAuthenticate: parsed.usesAuthenticate,
          }),
          purpose: inferPurposeWithHandler({ method: ep.method, gatewayPath: gw, handler: ep.handler }),
          source: path.relative(repoRoot, routerFile).replace(/\\/g, '/'),
          handler: ep.handler,
        });
      }
    }
  }

  const gatewayAppPath = path.join(servicesDir, 'api-gateway', 'src', 'app.js');
  const gatewayAppSource = tryRead(gatewayAppPath) || '';
  const gatewayMounts = parseAppMounts(gatewayAppSource);
  for (const m of gatewayMounts) {
    if (m.operational) {
      inventory.push({
        method: m.method,
        service: 'api-gateway',
        servicePath: m.mountPath,
        gatewayPath: m.mountPath,
        auth: 'public',
        purpose: inferPurpose({ method: m.method, gatewayPath: m.mountPath }),
        source: 'services/api-gateway/src/app.js',
      });
      continue;
    }
    if (!m.requirePath) continue;
    if (m.mountPath === '/v1') continue;
    const routerFile = path.resolve(path.dirname(gatewayAppPath), `${m.requirePath}.js`);
    const routerSource = tryRead(routerFile);
    if (!routerSource) continue;
    const parsed = parseRouterFile(routerSource);
    for (const ep of parsed.endpoints) {
      const gwPath = posixJoin(m.mountPath, ep.path);
      inventory.push({
        method: ep.method,
        service: 'api-gateway',
        servicePath: gwPath,
        gatewayPath: gwPath,
        auth: m.mountPath.startsWith('/internal/') ? 'internal' : 'public',
        purpose: inferPurposeWithHandler({ method: ep.method, gatewayPath: gwPath, handler: ep.handler }),
        source: path.relative(repoRoot, routerFile).replace(/\\/g, '/'),
        handler: ep.handler,
      });
    }
  }

  const docsFiles = fs
    .readdirSync(docsDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.md'))
    .filter(
      (d) =>
        d.name !== 'ENDPOINTS_MISSING_FROM_DOCS.md' &&
        d.name !== 'ENDPOINT_GAP_REPORT.md'
    )
    .map((d) => path.join(docsDir, d.name));
  const docsText = docsFiles.map((f) => tryRead(f) || '').join('\n');
  const docsTextNorm = normalizeDocPath(docsText);

  const missing = [];
  for (const e of inventory) {
    if (!e.gatewayPath) continue;
    const needle = normalizeDocPath(e.gatewayPath);
    const serviceNeedle = e.servicePath ? normalizeDocPath(e.servicePath) : '';
    const found =
      docsTextNorm.includes(needle) ||
      (serviceNeedle && docsTextNorm.includes(serviceNeedle)) ||
      docsText.includes(e.gatewayPath);
    if (!found) {
      missing.push({ ...e, gatewayPathNorm: needle });
    }
  }

  missing.sort((a, b) => {
    if (a.service !== b.service) return a.service.localeCompare(b.service);
    if (a.gatewayPath !== b.gatewayPath) return a.gatewayPath.localeCompare(b.gatewayPath);
    return a.method.localeCompare(b.method);
  });

  const out = {
    generatedAt: new Date().toISOString(),
    totals: { inventory: inventory.length, missingFromDocs: missing.length },
    missing,
    inventory,
  };

  const json = JSON.stringify(out, null, 2);
  if (outFile) {
    fs.writeFileSync(path.resolve(repoRoot, outFile), json);
  } else {
    process.stdout.write(json);
  }
}

main();
