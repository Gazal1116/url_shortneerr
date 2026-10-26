const crypto = require('crypto');
const { UAParser } = require('ua-parser-js');
const geoip = require('geoip-lite');

function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '';
}

function parseRequestMeta(req) {
  const uaString = req.headers['user-agent'] || '';
  const parser = new UAParser(uaString);
  const result = parser.getResult();

  const ip = getClientIp(req);
  const lookupIp = ip.replace(/^::ffff:/, '');
  const geo = geoip.lookup(lookupIp) || {};

  const deviceType = result.device?.type || 'desktop';

  return {
    referrer: req.get('referer') || req.get('referrer') || 'direct',
    userAgent: uaString.slice(0, 512),
    device: deviceType,
    browser: result.browser?.name || 'unknown',
    os: result.os?.name || 'unknown',
    country: geo.country || 'Unknown',
    city: geo.city || 'Unknown',
    ipHash: hashIp(lookupIp),
  };
}

module.exports = { parseRequestMeta, getClientIp, hashIp };
