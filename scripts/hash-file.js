#!/usr/bin/env node
/**
 * Compute a SHA-256 hash for a preserved source file, for use as an
 * evidence item's document_hash field (spec section 8, section 21 item 6).
 *
 * Usage: node scripts/hash-file.js <path-to-file>
 */

const fs = require('fs');
const crypto = require('crypto');

const target = process.argv[2];

if (!target) {
  console.error('Usage: node scripts/hash-file.js <path-to-file>');
  process.exit(1);
}

if (!fs.existsSync(target)) {
  console.error(`File not found: ${target}`);
  process.exit(1);
}

const buffer = fs.readFileSync(target);
const hash = crypto.createHash('sha256').update(buffer).digest('hex');

console.log(`sha256:${hash}`);
console.log('');
console.log('Copy this value into the evidence record\'s "document_hash" field.');
