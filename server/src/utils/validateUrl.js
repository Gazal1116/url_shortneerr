const dns = require('dns').promises;
const net = require('net');

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata',
]);

function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip === '::1' || ip === '0.0.0.0') return true;

  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }

  const normalized = ip.toLowerCase();
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (normalized.startsWith('fe80')) return true;
  if (normalized.startsWith('::ffff:')) {
    return isPrivateIp(normalized.slice(7));
  }
  return false;
}

/**
 * Validate destination URL and block private/internal targets (SSRF guard).
 */
async function validateDestinationUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, error: 'Invalid URL format' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, error: 'Only http and https URLs are allowed' };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local')) {
    return { ok: false, error: 'Private or local destinations are not allowed' };
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { ok: false, error: 'Private or local destinations are not allowed' };
    }
    return { ok: true, url: parsed.toString() };
  }

  try {
    const records = await dns.lookup(hostname, { all: true });
    for (const { address } of records) {
      if (isPrivateIp(address)) {
        return {
          ok: false,
          error: 'Destination resolves to a private/internal address',
        };
      }
    }
  } catch {
    return { ok: false, error: 'Could not resolve destination hostname' };
  }

  return { ok: true, url: parsed.toString() };
}

module.exports = { validateDestinationUrl, isPrivateIp };
