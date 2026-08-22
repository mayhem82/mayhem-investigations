'use strict';

/*
 * Registry of every case's data directory, so validate.js and the
 * operator CLI tools (resume.js, add-source.js, log-run.js,
 * generate-relationship-map.js) work the same way across every case
 * instead of being hardcoded to one.
 *
 * DFAPTI-BB-2026-00001 keeps its original location - data/ at the
 * repository root - for backward compatibility with every existing
 * evidence-file reference and preserved/ filename. Every case added
 * after it gets its own cases/<CASE-ID>/data/, per the architecture
 * decision recorded in README.md and DEC-0019.
 */

const path = require('path');

const ROOT = path.join(__dirname, '..');

const CASES = [
  { id: 'DFAPTI-BB-2026-00001', dataDir: path.join(ROOT, 'data'), preservedDir: path.join(ROOT, 'preserved') },
  { id: 'DFAPTI-MNC-2026-00001', dataDir: path.join(ROOT, 'cases', 'DFAPTI-MNC-2026-00001', 'data'), preservedDir: path.join(ROOT, 'cases', 'DFAPTI-MNC-2026-00001', 'preserved') },
  { id: 'DFAPTI-BB-FF-2026-00001', dataDir: path.join(ROOT, 'cases', 'DFAPTI-BB-FF-2026-00001', 'data'), preservedDir: path.join(ROOT, 'cases', 'DFAPTI-BB-FF-2026-00001', 'preserved') },
];

function findCase(caseId) {
  const found = CASES.find((c) => c.id === caseId);
  if (!found) {
    throw new Error(`Unknown case "${caseId}". Known cases: ${CASES.map((c) => c.id).join(', ')}`);
  }
  return found;
}

const DEFAULT_CASE_ID = CASES[0].id;

module.exports = { CASES, findCase, DEFAULT_CASE_ID, ROOT };
