'use strict';
const crypto = require('crypto');
const COLLECTION_RESULTS = new Set(['No relevant change detected.', 'New evidence added.', 'New source added.', 'Source capture attempted.', 'Primary-source capture attempted; no evidence assertions promoted.']);
const ANALYSIS_RESULTS = new Set(['Analysis paths added.', 'No analysis paths added.', 'Analysis frozen; no action taken.']);
function digest(record) { return crypto.createHash('sha256').update(JSON.stringify(record)).digest('hex'); }
function validateRun(record, analysisIds = new Set()) {
  if (record.stage && !['DFAPTI', 'DFAPTA'].includes(record.stage)) return ['invalid stage'];
  if (record.stage !== 'DFAPTA') return COLLECTION_RESULTS.has(record.result) ? [] : [`invalid result "${record.result}"`];
  const errors = [];
  if (!ANALYSIS_RESULTS.has(record.result)) errors.push('invalid DFAPTA result');
  if (!Array.isArray(record.evidence_added) || record.evidence_added.length) errors.push('DFAPTA cannot add evidence');
  if (!Array.isArray(record.analysis_paths_added)) errors.push('analysis_paths_added must be an array');
  else {
    if (new Set(record.analysis_paths_added).size !== record.analysis_paths_added.length) errors.push('duplicate analysis path');
    for (const id of record.analysis_paths_added) if (!analysisIds.has(id)) errors.push(`unknown analysis path "${id}"`);
    if ((record.result === 'Analysis paths added.') !== (record.analysis_paths_added.length > 0)) errors.push('result does not match analysis paths added');
  }
  return errors;
}
module.exports = { validateRun, digest };
