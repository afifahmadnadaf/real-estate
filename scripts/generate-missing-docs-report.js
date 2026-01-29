'use strict';

const fs = require('fs');
const path = require('path');

function normalizeDocPath(p) {
  return String(p || '')
    .replace(/\\/g, '/')
    .replace(/:([A-Za-z0-9_]+)/g, '{$1}')
    .replace(/\{[^}]+\}/g, '{param}')
    .replace(/\/+/g, '/');
}

function escapeMd(s) {
  return String(s || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function toGatewayPath(p) {
  const gp = String(p || '');
  if (!gp) return '';
  return normalizeDocPath(gp);
}

function authLabel(a) {
  if (a === 'admin') return 'admin';
  if (a === 'required') return 'required';
  if (a === 'optional') return 'optional';
  if (a === 'internal') return 'internal';
  return 'public';
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const jsonPath = path.join(repoRoot, 'endpoint-inventory.generated.json');
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(raw);
  const missing = Array.isArray(data.missing) ? data.missing : [];

  const byService = new Map();
  for (const m of missing) {
    const service = m.service || 'unknown';
    if (!byService.has(service)) byService.set(service, []);
    byService.get(service).push(m);
  }

  const services = Array.from(byService.keys()).sort();
  const lines = [];
  lines.push('# Endpoints Missing From Docs');
  lines.push('');
  lines.push(`Generated: ${data.generatedAt || new Date().toISOString()}`);
  lines.push('');
  lines.push('This file lists API routes that exist in code but are not mentioned anywhere in `docs/*.md`.');
  lines.push('Placeholders are normalized to `{param}` so paths are comparable across implementations.');
  lines.push('');

  for (const service of services) {
    const items = byService.get(service) || [];
    items.sort((a, b) => {
      const ap = toGatewayPath(a.gatewayPath);
      const bp = toGatewayPath(b.gatewayPath);
      if (ap !== bp) return ap.localeCompare(bp);
      return String(a.method || '').localeCompare(String(b.method || ''));
    });

    lines.push(`## ${service}`);
    lines.push('');
    lines.push('| Method | Full gateway path | Owning service | Purpose | Auth |');
    lines.push('|---|---|---|---|---|');
    for (const it of items) {
      const method = it.method || '';
      const gatewayPath = toGatewayPath(it.gatewayPath || it.servicePath);
      const purpose = it.purpose || '';
      const auth = authLabel(it.auth);
      lines.push(
        `| ${escapeMd(method)} | ${escapeMd(gatewayPath)} | ${escapeMd(service)} | ${escapeMd(purpose)} | ${escapeMd(auth)} |`
      );
    }
    lines.push('');
  }

  const outPath = path.join(repoRoot, 'docs', 'ENDPOINTS_MISSING_FROM_DOCS.md');
  fs.writeFileSync(outPath, lines.join('\n'));
}

main();

