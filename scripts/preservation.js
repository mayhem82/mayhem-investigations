'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

function sha256(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }

function verifyPreserved(root, reference, digest) {
  if (!reference || typeof reference !== 'string') return 'document_hash has no preserved file reference';
  const file = path.resolve(root, reference);
  const relative = path.relative(root, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return 'preserved file is outside the repository';
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return 'preserved file is missing or is not a file: ' + reference;
  const realRelative = path.relative(fs.realpathSync(root), fs.realpathSync(file));
  if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) return 'preserved file resolves outside the repository';
  if (!digest) return null; // An unaccepted record may be awaiting hashing.
  const match = /^(?:sha256:)?([a-f0-9]{64})$/i.exec(digest);
  if (!match) return 'document_hash is not a SHA-256 digest';
  const expected = match[1].toLowerCase();
  if (sha256(fs.readFileSync(file)) === expected) return null;
  // Windows text checkout conversion must not masquerade as evidence corruption.
  // Consult Git only for tracked files with no staged or working-tree changes.
  try {
    cp.execFileSync('git', ['diff', '--quiet', 'HEAD', '--', relative], {cwd:root,stdio:'pipe'});
    const bytes = cp.execFileSync('git', ['show', 'HEAD:' + relative.split(path.sep).join('/')], {cwd:root,maxBuffer:25_000_000,stdio:['ignore','pipe','pipe']});
    if (sha256(bytes) === expected) return null;
  } catch { /* A missing/changed Git blob cannot satisfy the hash check. */ }
  return 'preserved file SHA-256 does not match document_hash: ' + reference;
}

module.exports = { verifyPreserved, sha256 };
