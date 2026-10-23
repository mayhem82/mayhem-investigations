const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { verifyPreserved, sha256 } = require('../scripts/preservation');

test('checks bytes, malformed hashes, missing paths and traversal', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mayhem-integrity-'));
  try {
    fs.writeFileSync(path.join(root, 'record.txt'), 'original bytes');
    const hash = sha256(Buffer.from('original bytes'));
    assert.equal(verifyPreserved(root, 'record.txt', 'sha256:'+hash), null);
    assert.match(verifyPreserved(root, 'missing.txt', hash), /missing/);
    assert.match(verifyPreserved(root, '../outside.txt', hash), /outside/);
    assert.match(verifyPreserved(root, 'record.txt', 'invalid'), /not a SHA-256/);
    fs.writeFileSync(path.join(root, 'record.txt'), 'changed bytes');
    assert.match(verifyPreserved(root, 'record.txt', hash), /does not match/);
  } finally {
    // Only this test's explicitly created file and empty directory are removed.
    fs.unlinkSync(path.join(root, 'record.txt'));
    fs.rmdirSync(root);
  }
});
