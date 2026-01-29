'use strict';

const net = require('net');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForTcp({ name, host, port, timeoutMs }) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await new Promise((resolve) => {
      const s = new net.Socket();
      const onDone = (val) => {
        try {
          s.destroy();
        } catch {
          void 0;
        }
        resolve(val);
      };
      s.setTimeout(1000);
      s.once('connect', () => onDone(true));
      s.once('timeout', () => onDone(false));
      s.once('error', () => onDone(false));
      s.connect(port, host);
    });
    if (ok) {
      process.stdout.write(`[wait] ${name} tcp ok ${host}:${port}\n`);
      return;
    }
    await sleep(250);
  }
  throw new Error(`[wait] timeout ${name} tcp ${host}:${port}`);
}

async function waitForHttp({ name, url, timeoutMs }) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) {
        process.stdout.write(`[wait] ${name} http ok ${url}\n`);
        return;
      }
    } catch {
      void 0;
    }
    await sleep(500);
  }
  throw new Error(`[wait] timeout ${name} http ${url}`);
}

async function main() {
  const timeoutMs = parseInt(process.env.WAIT_TIMEOUT_MS, 10) || 120000;

  const postgresHost = process.env.POSTGRES_HOST || 'localhost';
  const postgresPort = parseInt(process.env.POSTGRES_PORT, 10) || 5432;

  const mongoHost = process.env.MONGO_HOST || 'localhost';
  const mongoPort = parseInt(process.env.MONGO_PORT, 10) || 27017;

  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT, 10) || 6379;

  const kafkaHost = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')[0].split(':')[0] || 'localhost';
  const kafkaPort = parseInt((process.env.KAFKA_BROKERS || 'localhost:9092').split(',')[0].split(':')[1], 10) || 9092;

  const esUrl = process.env.ELASTICSEARCH_URL || `http://${process.env.ELASTICSEARCH_HOST || 'localhost'}:${process.env.ELASTICSEARCH_PORT || '9200'}`;

  const s3Endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
  const gatewayUrl = process.env.GATEWAY_URL || `http://localhost:${process.env.API_GATEWAY_PORT || '3000'}`;

  await waitForTcp({ name: 'postgres', host: postgresHost, port: postgresPort, timeoutMs });
  await waitForTcp({ name: 'mongo', host: mongoHost, port: mongoPort, timeoutMs });
  await waitForTcp({ name: 'redis', host: redisHost, port: redisPort, timeoutMs });
  await waitForTcp({ name: 'kafka', host: kafkaHost, port: kafkaPort, timeoutMs });
  await waitForHttp({ name: 'elasticsearch', url: `${esUrl.replace(/\\/$/, '')}/_cluster/health`, timeoutMs });
  await waitForHttp({ name: 'minio', url: `${s3Endpoint.replace(/\\/$/, '')}/minio/health/live`, timeoutMs });
  await waitForHttp({ name: 'gateway', url: `${gatewayUrl.replace(/\\/$/, '')}/health`, timeoutMs });
}

main().catch((err) => {
  process.stderr.write(String(err && err.stack ? err.stack : err));
  process.exitCode = 1;
});

