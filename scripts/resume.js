#!/usr/bin/env node
/**
 * Resumption Protocol (spec section 19).
 *
 * Prints the current investigation state so work can continue exactly
 * where it left off, with no reconstruction and no searching for previous
 * work. Read-only.
 *
 * Usage: node scripts/resume.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readJson(filename, fallback) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const caseDef = readJson('case.json', null);
const evidence = readJson('evidence_register.json', []);
const chronology = readJson('chronology.json', []);
const contradictions = readJson('contradictions.json', []);
const openQuestions = readJson('open_questions.json', []);
const threads = readJson('threads.json', []);
const automationLog = readJson('automation_log.json', []);

function last(arr, n) {
  return arr.slice(Math.max(0, arr.length - n));
}

console.log('====================================================');
console.log('MAYHEM DFAPTI - Resumption Briefing');
console.log('====================================================');
console.log('');

if (!caseDef) {
  console.log('No case definition found. Nothing to resume.');
  process.exit(1);
}

console.log(`Case: ${caseDef.case_identifier} - ${caseDef.case_title}`);
console.log(`Status: ${caseDef.current_status}`);
console.log('');

console.log(`Evidence Register: ${evidence.length} item(s)`);
if (evidence.length) {
  last(evidence, 5).forEach((e) => console.log(`  - ${e.evidence_id}: ${e.source_title} (${e.verification_state})`));
} else {
  console.log('  No evidence collected yet.');
}
console.log('');

console.log(`Chronology: ${chronology.length} entr${chronology.length === 1 ? 'y' : 'ies'}`);
if (chronology.length) {
  last(chronology, 5).forEach((c) => console.log(`  - ${c.chronology_id}: ${c.event_date} - ${c.event_description} [${c.status}]`));
} else {
  console.log('  Empty.');
}
console.log('');

const openContradictions = contradictions.filter((c) => c.status === 'Open' || c.status === 'Partially Resolved');
console.log(`Contradictions: ${contradictions.length} total, ${openContradictions.length} open/partially resolved`);
openContradictions.forEach((c) => console.log(`  - ${c.contradiction_id}: ${c.description}`));
console.log('');

const unresolvedQuestions = openQuestions.filter((q) => q.status === 'Open');
console.log(`Open Questions: ${unresolvedQuestions.length} of ${openQuestions.length} unresolved`);
unresolvedQuestions.forEach((q) => console.log(`  - ${q.question_id}: ${q.question}`));
console.log('');

const activeThreads = threads.filter((t) => t.completion_state !== 'Complete');
console.log(`Investigation Threads: ${activeThreads.length} of ${threads.length} active`);
activeThreads.forEach((t) => console.log(`  - ${t.thread_id} ${t.name}: ${t.status}`));
console.log('');

if (automationLog.length) {
  const lastRun = automationLog[automationLog.length - 1];
  console.log(`Last automation run: ${lastRun.run_id} (${lastRun.date}) - ${lastRun.result}`);
} else {
  console.log('Last automation run: none recorded.');
}
console.log('');
console.log('Continue collecting evidence. No reconstruction required.');
