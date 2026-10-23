const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeUrl } = require('../scripts/source-identity');

test('normalizes hostname and scheme only', () => {
  assert.equal(normalizeUrl('HTTPS://EXAMPLE.COM/Record.pdf'), 'https://example.com/Record.pdf');
});
test('preserves distinct paths, query values and trailing slashes', () => {
  for (const [a, b] of [['/Record.pdf','/record.pdf'], ['/?id=A','/?id=a'], ['/record','/record/']]) {
    assert.notEqual(normalizeUrl('https://example.com'+a), normalizeUrl('https://example.com'+b));
  }
});
test('preserves non-URL locations', () => {
  assert.equal(normalizeUrl('preserved/Record.txt'), 'preserved/Record.txt');
});
