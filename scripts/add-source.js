#!/usr/bin/env node
/**
 * Add or re-check a source in the Source Register, with stable source
 * identity (spec section 21 item 5): the same URL / file location always
 * resolves to the same source_id, so re-checking a source never creates a
 * duplicate register entry.
 *
 * Adding a new source:
 *   node scripts/add-source.js --authority "Kempsey Shire Council" \
 *     --title "Ordinary Council Meeting Minutes, July 2026" \
 *     --type "Council Record" \
 *     --url "https://example.gov.au/minutes/2026-07.pdf" \
 *     [--thread THR-07] [--notes "..."]
 *
 * Re-checking an existing source (same --url):
 *   node scripts/add-source.js --url "https://example.gov.au/minutes/2026-07.pdf" \
 *     --version "Revised 2026-07-20 edition" \
 *     [--preservation Preserved] [--hash-status Hashed]
 *
 * This is the only script that mutates an existing record in place, and
 * only the fields documented as mutable in docs/DATA_MODEL.md
 * (last_checked, current_version, preservation_status, hash_status).
 * Every other field, once set, is never changed.
 */

const fs = require('fs');
const path = require('path');
const { findCase, DEFAULT_CASE_ID } = require('./case-registry');

const caseArgIndex = process.argv.indexOf('--case');
const caseId = caseArgIndex !== -1 ? process.argv[caseArgIndex + 1] : DEFAULT_CASE_ID;
const DATA_FILE = path.join(findCase(caseId).dataDir, 'source_register.json');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    args[key.slice(2)] = argv[i + 1];
  }
  return args;
}

function normalizeUrl(value) {
  return String(value || '').trim().toLowerCase().replace(/\/+$/, '');
}

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function nextId(sources) {
  let max = 0;
  for (const s of sources) {
    const match = /^SRC-(\d+)$/.exec(s.source_id || '');
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return 'SRC-' + String(max + 1).padStart(4, '0');
}

const args = parseArgs(process.argv.slice(2));

if (!args.url) {
  console.error('Usage: node scripts/add-source.js --url <location> [--authority ...] [--title ...] [--type ...] [--thread ...] [--notes ...] [--version ...] [--preservation ...] [--hash-status ...]');
  process.exit(1);
}

const sources = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const normalized = normalizeUrl(args.url);
const existing = sources.find((s) => normalizeUrl(s.url_or_file_location) === normalized);

if (existing) {
  existing.last_checked = todayIso();
  if (args.version) existing.current_version = args.version;
  if (args.preservation) existing.preservation_status = args.preservation;
  if (args['hash-status']) existing.hash_status = args['hash-status'];
  if (args.notes) existing.availability_notes = args.notes;
  fs.writeFileSync(DATA_FILE, JSON.stringify(sources, null, 2) + '\n');
  console.log(`Re-checked existing source ${existing.source_id} (stable identity preserved). last_checked -> ${existing.last_checked}`);
  process.exit(0);
}

if (!args.authority || !args.title || !args.type) {
  console.error('New source requires --authority, --title, and --type in addition to --url.');
  process.exit(1);
}

const record = {
  source_id: nextId(sources),
  authority: args.authority,
  title: args.title,
  type: args.type,
  url_or_file_location: args.url,
  first_checked: todayIso(),
  last_checked: todayIso(),
  current_version: args.version || 'Initial check',
  preservation_status: args.preservation || 'Not Preserved',
  hash_status: args['hash-status'] || 'No Hash',
  associated_thread: args.thread || null,
  availability_notes: args.notes || null,
};

sources.push(record);
fs.writeFileSync(DATA_FILE, JSON.stringify(sources, null, 2) + '\n');
console.log(`Added new source ${record.source_id}: ${record.title}`);
