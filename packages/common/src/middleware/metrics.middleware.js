'use strict';

const metricsStore = {
  requestsTotal: new Map(),
  requestDurationMsTotal: new Map(),
  requestDurationMsCount: new Map(),
};

function normalizePath(req) {
  const base = req.baseUrl || '';
  if (req.route?.path) {
    return `${base}${req.route.path}`;
  }
  return `${base}${req.path || ''}`;
}

function inc(map, key, value = 1) {
  map.set(key, (map.get(key) || 0) + value);
}

function renderMetrics() {
  const lines = [];
  lines.push('# TYPE http_requests_total counter');
  for (const [labels, value] of metricsStore.requestsTotal.entries()) {
    lines.push(`http_requests_total{${labels}} ${value}`);
  }
  lines.push('# TYPE http_request_duration_ms_sum counter');
  for (const [labels, value] of metricsStore.requestDurationMsTotal.entries()) {
    lines.push(`http_request_duration_ms_sum{${labels}} ${value}`);
  }
  lines.push('# TYPE http_request_duration_ms_count counter');
  for (const [labels, value] of metricsStore.requestDurationMsCount.entries()) {
    lines.push(`http_request_duration_ms_count{${labels}} ${value}`);
  }
  return `${lines.join('\n')}\n`;
}

function metricsMiddleware() {
  return (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      const path = normalizePath(req);
      const labels = `method="${req.method}",path="${path}",status="${res.statusCode}"`;
      inc(metricsStore.requestsTotal, labels, 1);
      inc(metricsStore.requestDurationMsTotal, labels, durationMs);
      inc(metricsStore.requestDurationMsCount, labels, 1);
    });
    next();
  };
}

function metricsHandler() {
  return (req, res) => {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.status(200).send(renderMetrics());
  };
}

module.exports = {
  metricsMiddleware,
  metricsHandler,
};
