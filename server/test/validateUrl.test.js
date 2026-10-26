const test = require('node:test');
const assert = require('node:assert/strict');
const { isPrivateIp } = require('../src/utils/validateUrl');

test('blocks localhost and private IPv4 addresses', () => {
  assert.equal(isPrivateIp('127.0.0.1'), true);
  assert.equal(isPrivateIp('10.0.0.1'), true);
  assert.equal(isPrivateIp('192.168.1.1'), true);
  assert.equal(isPrivateIp('172.16.0.1'), true);
  assert.equal(isPrivateIp('169.254.1.1'), true);
});

test('allows public IPv4 addresses', () => {
  assert.equal(isPrivateIp('8.8.8.8'), false);
  assert.equal(isPrivateIp('1.1.1.1'), false);
});

test('blocks local IPv6 addresses', () => {
  assert.equal(isPrivateIp('::1'), true);
  assert.equal(isPrivateIp('fc00::1'), true);
  assert.equal(isPrivateIp('fe80::1'), true);
});
