const crypto = require('crypto');

const SKIP_SEGMENTS = new Set([
  'www',
  'u',
  '0',
  'd',
  'id',
  'v',
  'p',
  'w',
  'e',
  'm',
  'en',
  'us',
  'index',
  'html',
  'htm',
  'php',
  'asp',
  'aspx',
  'edit',
  'view',
  'preview',
  'share',
  'open',
  'raw',
  'blob',
  'tree',
  'src',
  'api',
  'app',
  'apps',
  'mobilebasic',
  'mobile',
  'basic',
]);

const SKIP_HOST_LABELS = new Set(['www', 'm', 'mobile', 'app', 'api']);

function isHashLike(segment) {
  if (segment.length > 18) return true;
  if (/^[0-9a-f]{10,}$/i.test(segment)) return true;
  // mixed long ids like Google Doc IDs
  if (segment.length >= 16 && /[0-9]/.test(segment) && /[a-z]/i.test(segment)) {
    return true;
  }
  return false;
}

function cleanToken(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Build a human-readable slug from a destination URL.
 * e.g. docs.google.com/document/... → "docs-google-document"
 */
function slugFromUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return '';
  }

  const hostLabels = parsed.hostname
    .replace(/^www\./, '')
    .split('.')
    .filter((p) => p && !SKIP_HOST_LABELS.has(p));

  let hostSlug = '';
  if (hostLabels.length >= 2) {
    // docs.google.com → docs-google  |  github.com → github
    const brand = hostLabels[hostLabels.length - 2];
    const sub = hostLabels.length > 2 ? hostLabels[0] : null;
    hostSlug = sub && sub !== brand ? `${sub}-${brand}` : brand;
  } else if (hostLabels.length === 1) {
    hostSlug = hostLabels[0];
  }

  const pathTokens = parsed.pathname
    .split('/')
    .map(cleanToken)
    .filter(Boolean)
    .filter((seg) => !SKIP_SEGMENTS.has(seg) && !isHashLike(seg) && seg.length >= 2);

  // Prefer meaningful path words (last 1–2)
  const pathSlug = pathTokens.slice(-2).join('-');

  let slug = [hostSlug, pathSlug].filter(Boolean).join('-');
  slug = cleanToken(slug).replace(/-+/g, '-');

  // Cap length; keep start which usually has the brand
  if (slug.length > 28) {
    slug = slug.slice(0, 28).replace(/-+$/g, '');
  }

  if (slug.length < 2) {
    slug = 'link';
  }

  return slug;
}

/** If base is taken, try base-2, base-3, then base-xxxx */
function withUniqueSuffix(base, attempt) {
  if (attempt === 0) return base;
  if (attempt < 20) {
    const candidate = `${base}-${attempt + 1}`;
    return candidate.length <= 32 ? candidate : `${base.slice(0, 24)}-${attempt + 1}`;
  }
  const suffix = crypto.randomBytes(2).toString('hex');
  return `${base.slice(0, 24)}-${suffix}`;
}

module.exports = { slugFromUrl, withUniqueSuffix };
// URL slug utility
