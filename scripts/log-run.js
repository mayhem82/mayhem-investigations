#!/usr/bin/env node
/**
 * Append a record to the Automation Log (spec sections 6-7).
 *
 * This repository has no live scanning agent; this script lets an operator
 * record a check-run by hand, in the same shape a future automated runner
 * would use. It only ever appends - existing runs are never edited.
 *
 * No change found:
 *   node scripts/log-run.js --sources SRC-0001,SRC-0002 --result "No relevant change detected."
 *
 * New evidence found:
 *   node scripts/log-run.js --sources SRC-0001 --result "New evidence added." \
 *     --evidence EV-0004 --notes "Council minutes revised with new flow data."
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'automation_log.json');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    args[key.slice(2)] = argv[i + 1];
  }
  return args;
}

function splitList(value) {
  return String(value || '').split(',').map((v) => v.trim()).filter(Boolean);
}

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function nextId(runs) {
  let max = 0;
  for (const r of runs) {
    const match = /^RUN-(\d+)$/.exec(r.run_id || '');
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return 'RUN-' + String(max + 1).padStart(4, '0');
}

const args = parseArgs(process.argv.slice(2));

if (!args.result) {
  console.error('Usage: node scripts/log-run.js --sources SRC-0001,SRC-0002 --result "No relevant change detected." [--evidence EV-0004,...] [--notes "..."]');
  process.exit(1);
}

const runs = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

const record = {
  run_id: nextId(runs),
  date: todayIso(),
  sources_checked: splitList(args.sources),
  result: args.result,
  evidence_added: splitList(args.evidence),
  notes: args.notes || null,
};

runs.push(record);
fs.writeFileSync(DATA_FILE, JSON.stringify(runs, null, 2) + '\n');
console.log(`Logged ${record.run_id}: ${record.result}`);
