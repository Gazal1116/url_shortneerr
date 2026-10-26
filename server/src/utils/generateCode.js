const crypto = require('crypto');

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const ALIAS_REGEX = /^[a-z0-9][a-z0-9_-]{1,31}$/;

function generateCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

function generatePrettyCode() {
  const prefixes = ['go', 'to', 'get', 'see', 'open', 'link', 'tap', 'view'];
  const prefix = prefixes[crypto.randomBytes(1)[0] % prefixes.length];
  return `${prefix}-${generateCode(4)}`;
}

function isValidAlias(alias) {
  return ALIAS_REGEX.test(alias);
}

function normalizeAlias(alias) {
  return String(alias || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

module.exports = {
  generateCode,
  generatePrettyCode,
  isValidAlias,
  normalizeAlias,
  ALIAS_REGEX,
};
