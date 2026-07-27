#!/usr/bin/env node
/**
 * MAYHEM DFAPTI repository validator.
 *
 * Implements the validation rules of MAYHEM-SPEC-DFAPTI-WATER-001-v2.0
 * section 16, against the concrete schema in docs/DATA_MODEL.md.
 *
 * Read-only: this script never modifies data. It exits 0 with a summary
 * when every rule passes, or exits 1 and prints every failing rule when
 * any record fails validation.
 *
 * Usage: node scripts/validate.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function readJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fail(`Missing required data file: data/${filename}`);
    return null;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    fail(`data/${filename} is not valid JSON: ${e.message}`);
    return null;
  }
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isArray(v) {
  return Array.isArray(v);
}

function requireFields(record, fields, recordLabel) {
  for (const field of fields) {
    if (!(field in record)) {
      fail(`${recordLabel}: missing required field "${field}"`);
    }
  }
}

function checkUnique(records, idField, registerLabel) {
  const seen = new Map();
  for (const r of records) {
    const id = r[idField];
    if (!isNonEmptyString(id)) continue;
    if (seen.has(id)) {
      fail(`${registerLabel}: duplicate ${idField} "${id}"`);
    }
    seen.set(id, true);
  }
}

function checkReferences(ids, validIdSet, recordLabel, fieldLabel) {
  if (!isArray(ids)) return;
  for (const id of ids) {
    if (!validIdSet.has(id)) {
      fail(`${recordLabel}: ${fieldLabel} references unknown id "${id}"`);
    }
  }
}

// ---------------------------------------------------------------------
// Enumerations (spec sections 25, 26, and this repository's own enums)
// ---------------------------------------------------------------------

const SOURCE_TYPES = new Set([
  'Legislation', 'Regulation', 'Government Record', 'Council Record',
  'Policy', 'Strategy', 'Planning Instrument', 'Court Decision',
  'Scientific Publication', 'Academic Literature', 'Media Report',
  'Public Statement', 'Community Submission', 'Mapping',
  'Satellite Imagery', 'Photograph', 'Video', 'Audio',
  'Inspection Record', 'Correspondence', 'Other Public Record',
]);

const EVIDENCE_CLASSIFICATIONS = new Set([
  'Original Available', 'Complete', 'Partial', 'Archived',
  'Secondary Reference', 'Requires Verification',
]);

const VERIFICATION_STATES = new Set([
  'Unverified', 'Requires Verification', 'Verified', 'Disputed', 'Accepted',
]);

const CHRONOLOGY_STATUSES = new Set(['Confirmed', 'Pending']);

const CONTRADICTION_STATUSES = new Set([
  'Open', 'Partially Resolved', 'Resolved', 'Unable to Resolve',
]);

const QUESTION_STATUSES = new Set(['Open', 'Closed']);

const THREAD_STATUSES = new Set([
  'Not Started', 'In Progress', 'Blocked', 'Complete',
]);

const THREAD_COMPLETION_STATES = new Set(['Not Complete', 'Complete']);

const PRESERVATION_STATUSES = new Set([
  'Not Preserved', 'Partially Preserved', 'Preserved',
]);

const HASH_STATUSES = new Set(['No Hash', 'Hash Pending', 'Hashed']);

// ---------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------

const caseDef = readJson('case.json');
const evidence = readJson('evidence_register.json') || [];
const sources = readJson('source_register.json') || [];
const chronology = readJson('chronology.json') || [];
const contradictions = readJson('contradictions.json') || [];
const openQuestions = readJson('open_questions.json') || [];
const threads = readJson('threads.json') || [];

// ---------------------------------------------------------------------
// Case Definition (section 24)
// ---------------------------------------------------------------------

const CASE_REQUIRED_FIELDS = [
  'case_identifier', 'case_title', 'investigation_type', 'jurisdiction',
  'geographic_scope', 'commencement_date', 'current_status', 'investigator',
  'repository_version', 'specification_version',
];

let validCaseId = null;

if (caseDef) {
  requireFields(caseDef, CASE_REQUIRED_FIELDS, 'case.json');
  for (const field of CASE_REQUIRED_FIELDS) {
    if (field in caseDef && !isNonEmptyString(caseDef[field])) {
      fail(`case.json: field "${field}" must be a non-empty string`);
    }
  }
  if (isNonEmptyString(caseDef.case_identifier)) {
    validCaseId = caseDef.case_identifier;
  }
}

function checkCaseId(record, recordLabel) {
  if (!isNonEmptyString(record.case_id)) {
    fail(`${recordLabel}: missing or empty "case_id"`);
  } else if (validCaseId && record.case_id !== validCaseId) {
    fail(`${recordLabel}: case_id "${record.case_id}" does not match the active case "${validCaseId}"`);
  }
}

// ---------------------------------------------------------------------
// Evidence Register (section 8)
// ---------------------------------------------------------------------

const EVIDENCE_REQUIRED_FIELDS = [
  'evidence_id', 'case_id', 'recording_date', 'source_date',
  'source_authority', 'source_title', 'source_type', 'source_location',
  'evidence_description', 'investigation_relevance', 'classification',
  'verification_state', 'relationships', 'chronology_links',
  'contradiction_links', 'open_question_links',
];

checkUnique(evidence, 'evidence_id', 'evidence_register.json');

const evidenceIds = new Set(
  evidence.filter((e) => isNonEmptyString(e.evidence_id)).map((e) => e.evidence_id)
);

for (const e of evidence) {
  const label = `evidence_register.json[${e.evidence_id || '?'}]`;
  requireFields(e, EVIDENCE_REQUIRED_FIELDS, label);
  checkCaseId(e, label);

  if ('source_type' in e && !SOURCE_TYPES.has(e.source_type)) {
    fail(`${label}: invalid source_type "${e.source_type}"`);
  }
  if ('classification' in e && !EVIDENCE_CLASSIFICATIONS.has(e.classification)) {
    fail(`${label}: invalid classification "${e.classification}"`);
  }
  if ('verification_state' in e && !VERIFICATION_STATES.has(e.verification_state)) {
    fail(`${label}: invalid verification_state "${e.verification_state}"`);
  }

  for (const arrField of ['relationships', 'chronology_links', 'contradiction_links', 'open_question_links']) {
    if (arrField in e && !isArray(e[arrField])) {
      fail(`${label}: field "${arrField}" must be an array`);
    }
  }

  // Rule: accepted evidence cannot possess zero proof-of-fact.
  if (e.verification_state === 'Accepted') {
    const hasProof = isNonEmptyString(e.preserved_file_reference)
      || isNonEmptyString(e.document_hash)
      || isNonEmptyString(e.source_location);
    if (!hasProof) {
      fail(`${label}: verification_state is "Accepted" but has no preserved_file_reference, document_hash, or source_location (zero proof-of-fact)`);
    }
    // Rule: accepted preserved documents possess document hashes unless an approved exception exists.
    if (isNonEmptyString(e.preserved_file_reference) && !isNonEmptyString(e.document_hash) && !isNonEmptyString(e.hash_exception_reason)) {
      fail(`${label}: has a preserved_file_reference but no document_hash and no hash_exception_reason`);
    }
  }

  checkReferences(e.relationships, evidenceIds, label, 'relationships');
}

// ---------------------------------------------------------------------
// Source Register (section 9)
// ---------------------------------------------------------------------

const SOURCE_REQUIRED_FIELDS = [
  'source_id', 'authority', 'title', 'type', 'url_or_file_location',
  'first_checked', 'last_checked', 'current_version', 'preservation_status',
  'hash_status',
];

checkUnique(sources, 'source_id', 'source_register.json');

for (const s of sources) {
  const label = `source_register.json[${s.source_id || '?'}]`;
  requireFields(s, SOURCE_REQUIRED_FIELDS, label);
  if ('type' in s && !SOURCE_TYPES.has(s.type)) {
    fail(`${label}: invalid type "${s.type}"`);
  }
  if ('preservation_status' in s && !PRESERVATION_STATUSES.has(s.preservation_status)) {
    fail(`${label}: invalid preservation_status "${s.preservation_status}"`);
  }
  if ('hash_status' in s && !HASH_STATUSES.has(s.hash_status)) {
    fail(`${label}: invalid hash_status "${s.hash_status}"`);
  }
  if (s.associated_thread && !isNonEmptyString(s.associated_thread)) {
    fail(`${label}: associated_thread must be a non-empty string if present`);
  }
}

// ---------------------------------------------------------------------
// Chronology (section 10)
// ---------------------------------------------------------------------

const CHRONOLOGY_REQUIRED_FIELDS = [
  'chronology_id', 'event_date', 'date_is_inference', 'event_description',
  'status', 'supporting_evidence',
];

checkUnique(chronology, 'chronology_id', 'chronology.json');

for (const c of chronology) {
  const label = `chronology.json[${c.chronology_id || '?'}]`;
  requireFields(c, CHRONOLOGY_REQUIRED_FIELDS, label);
  if ('status' in c && !CHRONOLOGY_STATUSES.has(c.status)) {
    fail(`${label}: invalid status "${c.status}"`);
  }
  if ('date_is_inference' in c && typeof c.date_is_inference !== 'boolean') {
    fail(`${label}: date_is_inference must be a boolean`);
  }
  if ('supporting_evidence' in c) {
    if (!isArray(c.supporting_evidence) || c.supporting_evidence.length === 0) {
      fail(`${label}: supporting_evidence must be a non-empty array`);
    } else {
      checkReferences(c.supporting_evidence, evidenceIds, label, 'supporting_evidence');
    }
  }
}

// ---------------------------------------------------------------------
// Contradiction Register (section 11)
// ---------------------------------------------------------------------

const CONTRADICTION_REQUIRED_FIELDS = [
  'contradiction_id', 'description', 'supporting_evidence',
  'opposing_evidence', 'status', 'material_significance',
  'required_resolution', 'resolution_evidence',
];

checkUnique(contradictions, 'contradiction_id', 'contradictions.json');

for (const c of contradictions) {
  const label = `contradictions.json[${c.contradiction_id || '?'}]`;
  requireFields(c, CONTRADICTION_REQUIRED_FIELDS, label);
  if ('status' in c && !CONTRADICTION_STATUSES.has(c.status)) {
    fail(`${label}: invalid status "${c.status}"`);
  }
  if ('supporting_evidence' in c) {
    if (!isArray(c.supporting_evidence) || c.supporting_evidence.length === 0) {
      fail(`${label}: supporting_evidence must be a non-empty array`);
    } else {
      checkReferences(c.supporting_evidence, evidenceIds, label, 'supporting_evidence');
    }
  }
  if ('opposing_evidence' in c) {
    if (!isArray(c.opposing_evidence) || c.opposing_evidence.length === 0) {
      fail(`${label}: opposing_evidence must be a non-empty array`);
    } else {
      checkReferences(c.opposing_evidence, evidenceIds, label, 'opposing_evidence');
    }
  }
  if (c.status === 'Resolved') {
    if (!isArray(c.resolution_evidence) || c.resolution_evidence.length === 0) {
      fail(`${label}: status is "Resolved" but resolution_evidence is empty`);
    } else {
      checkReferences(c.resolution_evidence, evidenceIds, label, 'resolution_evidence');
    }
  }
}

// ---------------------------------------------------------------------
// Open Question Register (section 12)
// ---------------------------------------------------------------------

const QUESTION_REQUIRED_FIELDS = [
  'question_id', 'question', 'why_exists', 'evidence_creating_question',
  'evidence_required_to_resolve', 'likely_source', 'status',
  'resolution_evidence',
];

checkUnique(openQuestions, 'question_id', 'open_questions.json');

for (const q of openQuestions) {
  const label = `open_questions.json[${q.question_id || '?'}]`;
  requireFields(q, QUESTION_REQUIRED_FIELDS, label);
  if ('status' in q && !QUESTION_STATUSES.has(q.status)) {
    fail(`${label}: invalid status "${q.status}"`);
  }
  if ('evidence_creating_question' in q) {
    checkReferences(q.evidence_creating_question, evidenceIds, label, 'evidence_creating_question');
  }
  if (q.status === 'Closed') {
    if (!isArray(q.resolution_evidence) || q.resolution_evidence.length === 0) {
      fail(`${label}: status is "Closed" but resolution_evidence is empty`);
    } else {
      checkReferences(q.resolution_evidence, evidenceIds, label, 'resolution_evidence');
    }
  }
}

// ---------------------------------------------------------------------
// Investigation Threads (section 13)
// ---------------------------------------------------------------------

const THREAD_REQUIRED_FIELDS = [
  'thread_id', 'name', 'status', 'supporting_evidence', 'outstanding_work',
  'dependencies', 'completion_state',
];

checkUnique(threads, 'thread_id', 'threads.json');

const threadIds = new Set(
  threads.filter((t) => isNonEmptyString(t.thread_id)).map((t) => t.thread_id)
);

for (const t of threads) {
  const label = `threads.json[${t.thread_id || '?'}]`;
  requireFields(t, THREAD_REQUIRED_FIELDS, label);
  if ('status' in t && !THREAD_STATUSES.has(t.status)) {
    fail(`${label}: invalid status "${t.status}"`);
  }
  if ('completion_state' in t && !THREAD_COMPLETION_STATES.has(t.completion_state)) {
    fail(`${label}: invalid completion_state "${t.completion_state}"`);
  }
  if ('supporting_evidence' in t) {
    checkReferences(t.supporting_evidence, evidenceIds, label, 'supporting_evidence');
  }
  if ('dependencies' in t) {
    checkReferences(t.dependencies, threadIds, label, 'dependencies');
  }
}

// ---------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------

console.log('MAYHEM DFAPTI repository validation');
console.log('====================================');
console.log(`Case:               ${validCaseId || '(invalid)'}`);
console.log(`Evidence items:     ${evidence.length}`);
console.log(`Sources:            ${sources.length}`);
console.log(`Chronology entries: ${chronology.length}`);
console.log(`Contradictions:     ${contradictions.length}`);
console.log(`Open questions:     ${openQuestions.length}`);
console.log(`Threads:            ${threads.length}`);
console.log('');

if (warnings.length) {
  console.log(`Warnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  - ${w}`);
  console.log('');
}

if (errors.length) {
  console.log(`FAILED - ${errors.length} validation error(s):`);
  for (const e of errors) console.log(`  - ${e}`);
  process.exit(1);
} else {
  console.log('PASSED - all validation rules satisfied.');
  process.exit(0);
}
