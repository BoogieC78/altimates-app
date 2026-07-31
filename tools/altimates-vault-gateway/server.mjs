#!/usr/bin/env node
/**
 * Read-only gateway between a Custom GPT Action and Obsidian Local REST API.
 *
 * It deliberately exposes only search and note-reading routes. The Obsidian API
 * key remains on this Mac; ChatGPT receives a separate gateway token.
 */
import { createServer } from 'node:http';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { stat } from 'node:fs/promises';
import { timingSafeEqual } from 'node:crypto';

const MAX_QUERY_LENGTH = 160;
const MAX_UPSTREAM_BYTES = 512 * 1024;
const MAX_RESPONSE_CHARS = 160 * 1024;

function required(name, value = process.env[name]) {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function parseConfig(env = process.env) {
  const obsidianUrl = new URL(env.OBSIDIAN_BASE_URL ?? 'https://127.0.0.1:27124');
  if (!['127.0.0.1', 'localhost', '::1'].includes(obsidianUrl.hostname)) {
    throw new Error('OBSIDIAN_BASE_URL must target localhost only.');
  }

  return {
    port: Number.parseInt(env.PORT ?? '8787', 10),
    obsidianUrl,
    obsidianApiKey: required('OBSIDIAN_API_KEY', env.OBSIDIAN_API_KEY),
    actionToken: required('CHATGPT_ACTION_TOKEN', env.CHATGPT_ACTION_TOKEN),
    vaultRoot: env.VAULT_ROOT ?? '',
    vaultPrefix: validateVaultPrefix(env.OBSIDIAN_VAULT_PREFIX ?? ''),
    freshnessPath: env.VAULT_FRESHNESS_PATH ?? 'graph.canvas',
  };
}

function constantTimeBearerMatches(header, token) {
  const expected = Buffer.from(`Bearer ${token}`);
  const actual = Buffer.from(header ?? '');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function validateNotePath(value) {
  if (!value || value.includes('\0') || value.includes('\\') || value.startsWith('/')) return false;
  const segments = value.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..' || segment === '.obsidian')) return false;
  return value.endsWith('.md') || value === 'graph.canvas';
}

function validateVaultPrefix(value) {
  if (!value) return '';
  const normalized = value.replace(/^\/+|\/+$/g, '');
  if (!normalized || normalized.includes('\\') || normalized.split('/').some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new Error('OBSIDIAN_VAULT_PREFIX must be a safe, relative directory path.');
  }
  return normalized;
}

function encodeVaultPath(relativePath) {
  return relativePath.split('/').map(encodeURIComponent).join('/');
}

function limitText(value, maxChars = MAX_RESPONSE_CHARS) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > maxChars ? { value: text.slice(0, maxChars), truncated: true } : { value: text, truncated: false };
}

function upstreamRequest(config, pathname, method = 'GET') {
  const target = new URL(pathname, config.obsidianUrl);
  const isHttps = target.protocol === 'https:';
  const request = isHttps ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    const upstream = request(target, {
      method,
      headers: {
        Authorization: `Bearer ${config.obsidianApiKey}`,
        Accept: 'application/json, text/markdown;q=0.9, text/plain;q=0.8',
      },
      // Local REST API commonly uses a self-signed local certificate. This is
      // safe here because parseConfig restricts the upstream to loopback.
      rejectUnauthorized: false,
      timeout: 10_000,
    }, (response) => {
      const chunks = [];
      let size = 0;
      response.on('data', (chunk) => {
        size += chunk.length;
        if (size <= MAX_UPSTREAM_BYTES) chunks.push(chunk);
      });
      response.on('end', () => resolve({
        statusCode: response.statusCode ?? 502,
        contentType: response.headers['content-type'] ?? 'text/plain; charset=utf-8',
        body: Buffer.concat(chunks).toString('utf8'),
        truncated: size > MAX_UPSTREAM_BYTES,
      }));
    });
    upstream.on('timeout', () => upstream.destroy(new Error('Obsidian Local REST API timeout')));
    upstream.on('error', reject);
    upstream.end();
  });
}

function upstreamVaultPath(config, notePath) {
  const prefix = config.vaultPrefix ? `${config.vaultPrefix}/` : '';
  return `/vault/${encodeVaultPath(`${prefix}${notePath}`)}`;
}

function filterSearchResults(payload, vaultPrefix) {
  if (!Array.isArray(payload)) return [];
  if (!vaultPrefix) return payload;
  const prefix = `${vaultPrefix}/`;
  return payload
    .filter((item) => typeof item?.filename === 'string' && item.filename.startsWith(prefix))
    .map((item) => ({ ...item, filename: item.filename.slice(prefix.length) }));
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
  });
  response.end(JSON.stringify(body));
}

function parseMaybeJson(body) {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

async function freshness(config) {
  if (!config.vaultRoot) return { available: false };
  try {
    const info = await stat(`${config.vaultRoot}/${config.freshnessPath}`);
    return { available: true, modifiedAt: info.mtime.toISOString() };
  } catch {
    return { available: false };
  }
}

export function createGateway(config) {
  return createServer(async (request, response) => {
    if (request.method !== 'GET') return sendJson(response, 405, { error: 'method_not_allowed' });
    if (!constantTimeBearerMatches(request.headers.authorization, config.actionToken)) {
      return sendJson(response, 401, { error: 'unauthorized' });
    }

    const url = new URL(request.url ?? '/', 'http://gateway.local');
    try {
      if (url.pathname === '/health') {
        const probe = await upstreamRequest(config, '/');
        return sendJson(response, probe.statusCode >= 200 && probe.statusCode < 500 ? 200 : 503, {
          status: probe.statusCode >= 200 && probe.statusCode < 500 ? 'ok' : 'degraded',
          obsidianStatus: probe.statusCode,
          freshness: await freshness(config),
        });
      }

      if (url.pathname === '/search') {
        const query = url.searchParams.get('q')?.trim() ?? '';
        if (!query || query.length > MAX_QUERY_LENGTH) return sendJson(response, 400, { error: 'invalid_query' });
        const upstream = await upstreamRequest(config, `/search/simple/?query=${encodeURIComponent(query)}`, 'POST');
        const result = limitText(filterSearchResults(parseMaybeJson(upstream.body), config.vaultPrefix));
        return sendJson(response, upstream.statusCode, {
          query,
          results: result.value,
          truncated: upstream.truncated || result.truncated,
        });
      }

      if (url.pathname.startsWith('/notes/')) {
        const rawPath = url.pathname.slice('/notes/'.length);
        let notePath;
        try {
          notePath = decodeURIComponent(rawPath);
        } catch {
          return sendJson(response, 400, { error: 'invalid_path' });
        }
        if (!validateNotePath(notePath)) return sendJson(response, 400, { error: 'invalid_path' });
        const upstream = await upstreamRequest(config, upstreamVaultPath(config, notePath));
        const result = limitText(parseMaybeJson(upstream.body));
        return sendJson(response, upstream.statusCode, {
          path: notePath,
          content: result.value,
          truncated: upstream.truncated || result.truncated,
        });
      }

      return sendJson(response, 404, { error: 'not_found' });
    } catch (error) {
      console.error('[altimates-vault-gateway]', error.message);
      return sendJson(response, 503, { error: 'vault_unavailable' });
    }
  });
}

function main() {
  const config = parseConfig();
  const gateway = createGateway(config);
  gateway.listen(config.port, '127.0.0.1', () => {
    console.log(`Altimates vault gateway listening on http://127.0.0.1:${config.port}`);
  });
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main();
