#!/usr/bin/env node
'use strict';

/*
 * Generates docs/RELATIONSHIP_MAP.md from the cross-reference fields
 * already present on the Evidence, Chronology, Contradiction, Open
 * Question, and Investigation Thread registers (spec section 14
 * "Relationship Map"). This mirrors app.js's buildRelationshipEdges /
 * buildNodeLabels logic exactly - there is no separate
 * data/relationships.json, and this script does not introduce one. It
 * only reads each case's data/*.json (scripts/case-registry.js) and
 * writes docs/RELATIONSHIP_MAP.md; it never modifies a register. One
 * section is generated per registered case.
 */

const fs = require('fs');
const path = require('path');
const { CASES, ROOT } = require('./case-registry');

const OUT_PATH = path.join(ROOT, 'docs', 'RELATIONSHIP_MAP.md');

function loadJson(dataDir, name) {
  const filePath = path.join(dataDir, name);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// ---------------------------------------------------------------
// Edge building - mirrors app.js buildRelationshipEdges exactly.
// ---------------------------------------------------------------

function nodeKey(type, id) {
  return type + ':' + id;
}

function buildRelationshipEdges(evidence, chronology, contradictions, questions, threads) {
  const edges = [];
  function addEdge(aType, aId, bType, bId, relation) {
    if (!aId || !bId) return;
    edges.push({ a: { type: aType, id: aId }, b: { type: bType, id: bId }, relation });
  }

  evidence.forEach((e) => {
    (e.relationships || []).forEach((id) => addEdge('Evidence', e.evidence_id, 'Evidence', id, 'related to'));
    (e.chronology_links || []).forEach((id) => addEdge('Evidence', e.evidence_id, 'Chronology', id, 'supports'));
    (e.contradiction_links || []).forEach((id) => addEdge('Evidence', e.evidence_id, 'Contradiction', id, 'involved in'));
    (e.open_question_links || []).forEach((id) => addEdge('Evidence', e.evidence_id, 'Question', id, 'involved in'));
  });
  chronology.forEach((c) => {
    (c.supporting_evidence || []).forEach((id) => addEdge('Chronology', c.chronology_id, 'Evidence', id, 'supported by'));
  });
  contradictions.forEach((c) => {
    (c.supporting_evidence || []).forEach((id) => addEdge('Contradiction', c.contradiction_id, 'Evidence', id, 'supported by'));
    (c.opposing_evidence || []).forEach((id) => addEdge('Contradiction', c.contradiction_id, 'Evidence', id, 'opposed by'));
    (c.resolution_evidence || []).forEach((id) => addEdge('Contradiction', c.contradiction_id, 'Evidence', id, 'resolved by'));
  });
  questions.forEach((q) => {
    (q.evidence_creating_question || []).forEach((id) => addEdge('Question', q.question_id, 'Evidence', id, 'raised by'));
    (q.resolution_evidence || []).forEach((id) => addEdge('Question', q.question_id, 'Evidence', id, 'resolved by'));
  });
  threads.forEach((t) => {
    (t.supporting_evidence || []).forEach((id) => addEdge('Thread', t.thread_id, 'Evidence', id, 'supported by'));
    (t.dependencies || []).forEach((id) => addEdge('Thread', t.thread_id, 'Thread', id, 'depends on'));
  });

  return edges;
}

function buildNodeLabels(evidence, chronology, contradictions, questions, threads) {
  const labels = {};
  evidence.forEach((e) => { labels[nodeKey('Evidence', e.evidence_id)] = e.source_title || e.evidence_id; });
  chronology.forEach((c) => { labels[nodeKey('Chronology', c.chronology_id)] = c.event_description || c.chronology_id; });
  contradictions.forEach((c) => { labels[nodeKey('Contradiction', c.contradiction_id)] = c.description || c.contradiction_id; });
  questions.forEach((q) => { labels[nodeKey('Question', q.question_id)] = q.question || q.question_id; });
  threads.forEach((t) => { labels[nodeKey('Thread', t.thread_id)] = t.name || t.thread_id; });
  return labels;
}

// ---------------------------------------------------------------
// Mermaid rendering
//
// A single full-graph diagram is unreadable at this register's size
// (hundreds of raw edge references), so this generates one flowchart per
// Investigation Thread - the thread, its supporting evidence, and those
// evidence items' own chronology/contradiction/question links - plus one
// small thread-dependency graph. This keeps each diagram scoped to what a
// reader investigating one thread actually needs.
// ---------------------------------------------------------------

const TYPE_PREFIX = { Evidence: 'EVID', Chronology: 'CHRO', Contradiction: 'CTRD', Question: 'QUES', Thread: 'THRD' };

function mermaidId(caseSlug, type, id) {
  return caseSlug + '_' + TYPE_PREFIX[type] + '_' + id.replace(/[^A-Za-z0-9]/g, '_');
}

function escapeLabel(text) {
  return String(text)
    .replace(/"/g, "'")
    .replace(/\n/g, ' ')
    .slice(0, 90);
}

function nodeLine(caseSlug, type, id, labels) {
  const key = nodeKey(type, id);
  const label = labels[key] ? id + ': ' + escapeLabel(labels[key]) : id;
  const shape = type === 'Thread' ? ['((', '))'] : type === 'Question' ? ['{{', '}}'] : type === 'Contradiction' ? ['[/', '/]'] : ['[', ']'];
  return '  ' + mermaidId(caseSlug, type, id) + shape[0] + '"' + label + '"' + shape[1];
}

function edgeLine(caseSlug, edge) {
  return '  ' + mermaidId(caseSlug, edge.a.type, edge.a.id) + ' -- "' + edge.relation + '" --> ' + mermaidId(caseSlug, edge.b.type, edge.b.id);
}

function buildThreadDiagram(caseSlug, thread, edges, labels) {
  const nodeSet = new Map();
  const edgeLines = [];
  const edgeSeen = new Set();

  function addNode(type, id) {
    const key = nodeKey(type, id);
    if (!nodeSet.has(key)) nodeSet.set(key, { type, id });
  }
  function addEdgeLine(edge) {
    const dedupe = nodeKey(edge.a.type, edge.a.id) + '|' + edge.relation + '|' + nodeKey(edge.b.type, edge.b.id);
    if (edgeSeen.has(dedupe)) return;
    edgeSeen.add(dedupe);
    edgeLines.push(edgeLine(caseSlug, edge));
  }

  addNode('Thread', thread.thread_id);
  const evidenceIds = new Set(thread.supporting_evidence || []);
  evidenceIds.forEach((id) => addNode('Evidence', id));

  // Thread -> its supporting evidence.
  edges.forEach((edge) => {
    if (edge.a.type === 'Thread' && edge.a.id === thread.thread_id && edge.b.type === 'Evidence' && evidenceIds.has(edge.b.id)) {
      addEdgeLine(edge);
    }
  });

  // Each supporting-evidence item's own links to Chronology/Contradiction/Question.
  edges.forEach((edge) => {
    if (edge.a.type === 'Evidence' && evidenceIds.has(edge.a.id) && ['Chronology', 'Contradiction', 'Question'].includes(edge.b.type)) {
      addNode(edge.b.type, edge.b.id);
      addEdgeLine(edge);
    }
  });

  if (nodeSet.size <= 1) return null; // thread node only, nothing to draw

  const lines = ['```mermaid', 'flowchart LR'];
  nodeSet.forEach((node) => lines.push(nodeLine(caseSlug, node.type, node.id, labels)));
  lines.push(...edgeLines);
  lines.push('```');
  return lines.join('\n');
}

function buildThreadDependencyDiagram(caseSlug, threads, edges, labels) {
  const depEdges = edges.filter((e) => e.a.type === 'Thread' && e.b.type === 'Thread');
  if (!depEdges.length) return null;
  const nodeSet = new Map();
  depEdges.forEach((e) => {
    nodeSet.set(nodeKey(e.a.type, e.a.id), e.a);
    nodeSet.set(nodeKey(e.b.type, e.b.id), e.b);
  });
  const lines = ['```mermaid', 'flowchart LR'];
  nodeSet.forEach((node) => lines.push(nodeLine(caseSlug, node.type, node.id, labels)));
  depEdges.forEach((e) => lines.push(edgeLine(caseSlug, e)));
  lines.push('```');
  return lines.join('\n');
}

// ---------------------------------------------------------------
// Per-case section assembly
// ---------------------------------------------------------------

function generateCaseSection(caseInfo) {
  const dataDir = caseInfo.dataDir;
  const evidence = loadJson(dataDir, 'evidence_register.json');
  const chronology = loadJson(dataDir, 'chronology.json');
  const contradictions = loadJson(dataDir, 'contradictions.json');
  const questions = loadJson(dataDir, 'open_questions.json');
  const threads = loadJson(dataDir, 'threads.json');
  const caseSlug = caseInfo.id.replace(/[^A-Za-z0-9]/g, '_');

  const edges = buildRelationshipEdges(evidence, chronology, contradictions, questions, threads);
  const labels = buildNodeLabels(evidence, chronology, contradictions, questions, threads);

  const sections = [];
  sections.push(`## Case: ${caseInfo.id}`);
  sections.push('');
  sections.push(
    `${edges.length} relationship reference(s) across ${evidence.length} evidence, ` +
    `${chronology.length} chronology, ${contradictions.length} contradiction, ` +
    `${questions.length} open question, ${threads.length} thread record(s).`
  );
  sections.push('');

  const depDiagram = buildThreadDependencyDiagram(caseSlug, threads, edges, labels);
  if (depDiagram) {
    sections.push('### Thread dependencies');
    sections.push('');
    sections.push(depDiagram);
    sections.push('');
  }

  sections.push('### Threads');
  sections.push('');

  threads.forEach((thread) => {
    const diagram = buildThreadDiagram(caseSlug, thread, edges, labels);
    sections.push(`#### ${thread.thread_id} — ${thread.name}`);
    sections.push('');
    sections.push(`Status: ${thread.status} | Completion: ${thread.completion_state}`);
    sections.push('');
    if (diagram) {
      sections.push(diagram);
    } else {
      sections.push('_No linked evidence recorded yet for this thread._');
    }
    sections.push('');
  });

  return { text: sections.join('\n'), edgeCount: edges.length, threadCount: threads.length };
}

// ---------------------------------------------------------------
// Assemble the Markdown file
// ---------------------------------------------------------------

function generate() {
  const sections = [];
  sections.push('# Relationship Map');
  sections.push('');
  sections.push(
    '_Generated by `scripts/generate-relationship-map.js` from the cross-reference ' +
    'fields on the Evidence, Chronology, Contradiction, Open Question, and ' +
    'Investigation Thread registers (spec section 14), independently per case ' +
    '(`scripts/case-registry.js`). This file is a derived view, not a source of ' +
    'truth - do not hand-edit it; regenerate it instead. Each case\'s own live ' +
    'workspace Relationship Map view (`app.js`) computes the same edges ' +
    'dynamically at page load, scoped to that case; this file is a static, ' +
    'browsable snapshot across every case for readers off the live site (e.g. ' +
    'viewing the repository directly on GitHub).*'
  );
  sections.push('');
  sections.push(`Generated: ${new Date().toISOString()}`);
  sections.push('');
  sections.push(
    'A single graph of every relationship in a register is too dense to read, so ' +
    'each case below has one diagram per Investigation Thread - the thread, its ' +
    'supporting evidence, and those evidence items\' own links to chronology ' +
    'entries, contradictions, and open questions - plus one small diagram of ' +
    'dependencies between threads.'
  );
  sections.push('');

  let totalEdges = 0;
  let totalThreads = 0;

  for (const caseInfo of CASES) {
    const { text, edgeCount, threadCount } = generateCaseSection(caseInfo);
    totalEdges += edgeCount;
    totalThreads += threadCount;
    sections.push(text);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, sections.join('\n').trimEnd() + '\n');
  console.log('Wrote ' + path.relative(ROOT, OUT_PATH) + ' (' + totalEdges + ' edges, ' + totalThreads + ' threads across ' + CASES.length + ' case(s)).');
}

generate();
