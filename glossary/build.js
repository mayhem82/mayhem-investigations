#!/usr/bin/env node
/**
 * Static-render the glossary page from data.json, styled to match the
 * public-interest page's design system (this is a public-facing reference,
 * not part of the internal MAYHEM investigation dashboard).
 *
 * Content is embedded directly in the HTML at build time - no fetch, no
 * client-side DOM construction - so it's readable by any tool or crawler
 * that doesn't execute JavaScript. app.js is a ~30-line progressive
 * enhancement layer that only adds the live search filter on top.
 *
 * Usage: node glossary/build.js
 * Run this after editing data.json (e.g. after a new snapshot).
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data.json');
const OUT_PATH = path.join(__dirname, 'index.html');
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function statusCategory(status) {
  const s = (status || '').toUpperCase();
  if (s.indexOf('UNRESOLVED') !== -1) return 'unresolved';
  if (s.indexOf('AMBIGU') !== -1 || s.indexOf('COLLISION') !== -1) return 'ambiguous';
  if (s.indexOf('LEGACY') !== -1) return 'legacy';
  if (s.indexOf('CURRENT') !== -1) return 'current';
  if (s.indexOf('EXTERNAL') !== -1) return 'external';
  return 'other';
}

const CATEGORY_LABEL = {
  current: 'CURRENT', legacy: 'LEGACY', external: 'EXTERNAL',
  unresolved: 'UNRESOLVED', ambiguous: 'AMBIGUOUS', other: 'OTHER',
};

function computePatterns(glossary) {
  const patterns = [];

  // Pattern 1: legacy-term concentration by source document
  const legacy = glossary.filter((e) => e.category === 'legacy');
  const sourceCounts = {};
  legacy.forEach((e) => {
    const m = e.source.match(/([a-z0-9-]+\.pdf)/i);
    if (!m) return;
    sourceCounts[m[1]] = sourceCounts[m[1]] || [];
    sourceCounts[m[1]].push(e);
  });
  const topSources = Object.entries(sourceCounts).sort((a, b) => b[1].length - a[1].length).slice(0, 2);
  if (legacy.length && topSources.length) {
    const topCount = topSources.reduce((sum, [, items]) => sum + items.length, 0);
    const pct = Math.round((topCount / legacy.length) * 100);
    patterns.push({
      title: 'Legacy terminology concentrates in two documents, not many',
      finding: `${topCount} of ${legacy.length} LEGACY-tagged terms (${pct}%) trace to just two source documents: ` +
        topSources.map(([src, items]) => `${src.replace(/-/g, ' ').replace('.pdf', '')} (${items.length} terms)`).join(' and ') +
        `. Both are from 2013. Rather than legacy vocabulary being spread thinly across many aging documents, it's concentrated in two specific ones that haven't been reissued in over a decade, while other Council material (corporate planning, financial reporting) reads current.`,
      examples: topSources.flatMap(([, items]) => items.slice(0, 6)).map((e) => e.term),
    });
  }

  // Pattern 2: unresolved terms are almost all KSC's own internal identifier codes
  const unresolved = glossary.filter((e) => e.category === 'unresolved');
  const internalCode = unresolved.filter((e) => /identifier|prefix|code|file/i.test(e.status));
  if (unresolved.length) {
    patterns.push({
      title: "Every unresolved term is Council's own internal code, not a hard word",
      finding: `${internalCode.length} of ${unresolved.length} UNRESOLVED terms (${Math.round((internalCode.length / unresolved.length) * 100)}%) are Council-invented identifier or file-numbering prefixes (FYY/####, T6-YY-###, D24/, TQE, PO######, ASD ###, TRIM, G#####-##) rather than difficult external terminology. The common thread across all of them: Council uses these codes constantly in its own records but has never published a key defining what the letters mean - the gap is documentation, not complexity.`,
      examples: unresolved.map((e) => e.term),
    });
  }

  // Pattern 3: collisions cluster at boundaries between KSC's functional domains
  const ambiguous = glossary.filter((e) => e.category === 'ambiguous');
  const domainRules = [
    { key: 'airport', label: 'airport/aviation vs. an older KSC domain', test: (e) => /airport|aerodrome/i.test(e.status + e.description) },
    { key: 'planning', label: 'planning/DCP vs. heritage or environment law', test: (e) => /\bDCP\b|biodiversity|heritage|environmental planning/i.test(e.description) },
    { key: 'revenue', label: 'rates/revenue vs. an overlapping statutory reference', test: (e) => /\brevenue\b|\brates?\b|\bstatutory\b|\bstormwater\b/i.test(e.status + e.description) },
  ];
  const clusters = domainRules.map((rule) => ({ ...rule, items: ambiguous.filter((e) => rule.test(e)) })).filter((c) => c.items.length);
  if (clusters.length) {
    patterns.push({
      title: "Terminology collisions cluster at the seams between Council's own functional areas",
      finding: `Of ${ambiguous.length} flagged collisions/ambiguities in the main glossary, they aren't scattered randomly - they cluster where two of Council's separate operational areas independently reused the same short code: ` +
        clusters.map((c) => `${c.items.length} at the ${c.label} boundary`).join('; ') +
        ` (AEP spans both the airport and planning boundaries at once, so it's counted in both). The airport is the newest and most distinct addition to Council's public vocabulary, and produces the most collisions with everything else.`,
      examples: Array.from(new Set(clusters.flatMap((c) => c.items.map((e) => e.term)))),
    });
  }

  return patterns;
}

function renderSource(sourceStr) {
  if (!sourceStr) return '';
  const parts = sourceStr.split(/\s*;\s*/);
  return parts.map((part) => {
    const m = part.match(/https?:\/\/\S+/);
    if (m) {
      let url = m[0].replace(/[)\].,]+$/, '');
      const prefix = part.slice(0, part.indexOf(url));
      return `<div class="src-line">${esc(prefix)}<a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a></div>`;
    }
    return part ? `<div class="src-line">${esc(part)}</div>` : '';
  }).join('');
}

function renderTermEntry(idPrefix, e) {
  const category = e.category || statusCategory(e.status);
  const searchText = esc(`${e.term} ${e.description} ${e.status}`.toLowerCase());
  const src = renderSource(e.source);
  return `
<div class="term-entry cat-${category}" id="${esc(idPrefix)}-${esc(slug(e.term))}" data-search="${searchText}">
  <div class="term-row"><span class="term-name">${esc(e.term)}</span><span class="cat-badge">${CATEGORY_LABEL[category] || category}</span></div>
  ${e.status ? `<div class="term-status">${esc(e.status)}</div>` : ''}
  <div class="term-desc">${esc(e.description)}</div>
  ${src ? `<div class="term-source-block">${src}</div>` : ''}
</div>`;
}

function renderOverview(d) {
  const snap = d.snapshot;
  const rules = d.classificationRules.map((r) => {
    const cls = { CURRENT: 'current', LEGACY: 'legacy', EXTERNAL: 'external', UNRESOLVED: 'unresolved', AMBIGUOUS: 'ambiguous' }[r.tag] || 'other';
    return `<div class="rule-cell"><b class="cat-badge cat-${cls}">${esc(r.tag)}</b><p>${esc(r.meaning)}</p></div>`;
  }).join('\n');

  const deltas = d.researchDeltas.slice().reverse().map((delta, i) => `
<details class="delta-block"${i === 0 ? ' open' : ''}>
  <summary><strong>${esc(delta.snapshot)}</strong> &mdash; ${esc(delta.date)} <span class="delta-count">${delta.items.length} item(s)</span></summary>
  <ul>${delta.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>
</details>`).join('\n');

  const snapshotDates = { '002': '20 Aug 2026', '003': '21 Aug 2026', '004': '21 Aug 2026', '005': '21 Aug 2026', '006': '21 Aug 2026', '007': '21 Aug 2026', '008': '21 Aug 2026' };
  const snapshotFiles = Object.keys(snapshotDates).map((padded) => {
    const day = padded === '002' ? '20' : '21';
    const current = padded === '008' ? ' &mdash; current' : '';
    return `<li><a href="preserved/KSC-Master-Glossary-Snapshot-${padded}-2026-08-${day}.docx">Snapshot ${padded} (.docx, ${snapshotDates[padded]})${current}</a></li>`;
  }).join('\n');

  return `
<div class="overview-card">
  <div class="kv"><span>Snapshot</span><b>${esc(snap.label)} (${esc(snap.id)})</b></div>
  <div class="kv"><span>Date frozen</span><b>${esc(snap.dateFrozen)}</b></div>
  <div class="kv"><span>Scope</span><b>${esc(snap.scope)}</b></div>
  <div class="kv"><span>Method</span><b>${esc(snap.method)}</b></div>
  <div class="kv"><span>Status</span><b>${esc(snap.status)}</b></div>
</div>
<h3 class="sub-heading">Classification rules</h3>
<div class="rule-grid">${rules}</div>
<h3 class="sub-heading">Research deltas by snapshot</h3>
<div class="stack">${deltas}</div>
<h3 class="sub-heading">Preserved snapshot files</h3>
<ul class="plain-list">${snapshotFiles}</ul>
<p class="muted-note">More snapshots will be added as further research sweeps arrive; each is kept alongside the ones before it rather than overwritten.</p>`;
}

function renderGlossary(d) {
  const list = d.glossary;
  const letters = [];
  list.forEach((e) => { if (letters.indexOf(e.letter) === -1) letters.push(e.letter); });
  const letterNav = letters.map((L) => `<a href="#glossary-letter-${esc(L)}">${esc(L)}</a>`).join('\n');

  let currentLetter = null;
  const entries = [];
  list.forEach((e) => {
    if (e.letter !== currentLetter) {
      currentLetter = e.letter;
      entries.push(`<h3 class="letter-heading" id="glossary-letter-${esc(currentLetter)}">${esc(currentLetter)}</h3>`);
    }
    entries.push(renderTermEntry('term', e));
  });

  return `
<p class="section-count">${list.length} term(s)</p>
<input type="text" id="glossary-filter" class="filter-input" placeholder="Search terms, expansions, statuses..." aria-label="Search glossary" />
<div class="letter-nav">${letterNav}</div>
<div id="glossary-list">${entries.join('\n')}</div>`;
}

function renderPatterns(d) {
  const patterns = computePatterns(d.glossary);
  if (!patterns.length) return '<p class="muted-note">No cross-entry patterns computed for this snapshot.</p>';
  return patterns.map((p) => {
    const examples = p.examples.slice(0, 10).map((term) =>
      `<a href="#term-${esc(slug(term))}">${esc(term)}</a>`).join(', ');
    const more = p.examples.length > 10 ? ` (+${p.examples.length - 10} more)` : '';
    return `
<div class="pattern-entry">
  <h3>${esc(p.title)}</h3>
  <p>${esc(p.finding)}</p>
  <div class="pattern-examples"><span class="kv-label">Terms behind this finding</span> ${examples}${more}</div>
</div>`;
  }).join('\n');
}

function renderReferenceSection(section) {
  if (section.type === 'terms') {
    const items = section.items.map((item) => {
      const src = renderSource(item.source);
      return `
<div class="term-entry cat-other">
  <div class="term-row"><span class="term-name">${esc(item.term)}</span></div>
  ${item.status ? `<div class="term-status">${esc(item.status)}</div>` : ''}
  <div class="term-desc">${esc(item.description)}</div>
  ${src ? `<div class="term-source-block">${src}</div>` : ''}
</div>`;
    }).join('\n');
    return `<div class="ref-block"><h4>${esc(section.title)}</h4>${items}</div>`;
  }
  const list = section.items.length
    ? `<ul>${section.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
    : '<p class="muted-note">(no items listed in the source this sweep)</p>';
  const note = section.note ? `<p class="note-box">${esc(section.note)}</p>` : '';
  return `<div class="ref-block"><h4>${esc(section.title)}</h4>${list}${note}</div>`;
}

function renderReference(d) {
  return d.referenceSections.map(renderReferenceSection).join('\n');
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="description" content="Kempsey Shire Council Master Glossary: terms, acronyms, codes and identifiers found in Council material, checked against primary sources, with known terminology collisions flagged. Part of the Ordinary Public Translation Layer." />
<meta property="og:title" content="KSC Master Glossary">
<meta property="og:description" content="Kempsey Shire Council terms, acronyms, codes and identifiers, checked against primary sources.">
<meta name="twitter:card" content="summary">
<title>KSC Master Glossary | Public Interest Investigations</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%92%A7%3C/text%3E%3C/svg%3E" />
<style>
:root { --ink: #17201c; --paper: #f2f0e9; --cream: #e8e4da; --acid: #d8ff3e; --red: #ef6045; --muted: #68716c; --line: #c8cbc3; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { background: var(--paper); color: var(--ink); margin: 0; font-family: Arial, Helvetica, sans-serif; }
a { color: inherit; }
.nav { border-bottom: 1px solid var(--line); backdrop-filter: blur(12px); z-index: 10; background: rgba(242,240,233,.94); justify-content: space-between; align-items: center; height: 68px; padding: 0 5vw; display: flex; position: sticky; top: 0; }
.wordmark { letter-spacing: .1em; align-items: center; gap: 10px; font-size: 13px; font-weight: 900; display: flex; text-decoration: none; }
.wordmark span { background: var(--ink); color: var(--acid); padding: 0 6px; height: 28px; display: grid; place-items: center; font-size: 11px; }
.navlinks { align-items: center; gap: 22px; font-size: 12px; font-weight: 700; display: flex; }
.navlinks a { text-decoration: none; }
.intro { padding: 56px 7vw 40px; max-width: 900px; }
.kicker { text-transform: uppercase; letter-spacing: .16em; font-size: 11px; font-weight: 800; color: var(--red); margin: 0 0 14px; }
.intro h1 { letter-spacing: -.03em; font-size: clamp(34px,5vw,58px); line-height: 1.03; margin: 0 0 16px; font-weight: 900; }
.intro p.lead { font-family: Georgia, serif; font-size: clamp(17px,1.6vw,21px); line-height: 1.5; color: rgb(56,67,62); max-width: 700px; margin: 0 0 22px; }
.page-nav { display: flex; flex-wrap: wrap; gap: 8px 22px; font-size: 13px; font-weight: 700; }
.page-nav a { text-decoration: underline; text-underline-offset: 3px; }
.section { padding: 40px 7vw 10px; max-width: 1100px; }
.section h2 { letter-spacing: -.03em; font-size: clamp(26px,3.4vw,40px); margin: 0 0 6px; }
.section-desc { color: var(--muted); max-width: 640px; line-height: 1.6; margin: 0 0 28px; }
.sub-heading { font-size: 15px; text-transform: uppercase; letter-spacing: .08em; margin: 32px 0 12px; color: var(--red); font-weight: 800; }
.overview-card { background: rgb(245,243,236); border-top: 5px solid var(--acid); padding: 22px 24px; }
.kv { border-bottom: 1px solid var(--line); padding: 12px 0; display: flex; flex-direction: column; gap: 3px; }
.kv:last-child { border-bottom: none; }
.kv span { text-transform: uppercase; letter-spacing: .07em; font-size: 11px; color: var(--muted); }
.kv b { font-weight: 400; font-size: 15px; line-height: 1.5; }
.rule-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 10px; }
.rule-cell { background: rgb(245,243,236); border: 1px solid var(--line); padding: 14px; }
.rule-cell p { margin: 8px 0 0; font-size: 13px; color: rgb(85,96,90); line-height: 1.5; }
.delta-block { background: rgb(245,243,236); border: 1px solid var(--line); padding: 14px 18px; margin-bottom: 8px; }
.delta-block summary { cursor: pointer; font-size: 14px; }
.delta-count { color: var(--muted); font-weight: 400; font-size: 12px; }
.delta-block ul { margin: 12px 0 0; padding-left: 20px; }
.delta-block li { font-size: 13.5px; line-height: 1.55; color: rgb(60,68,63); margin-bottom: 8px; }
.plain-list { list-style: none; padding: 0; margin: 0; }
.plain-list li { padding: 6px 0; font-size: 14px; }
.plain-list a { text-decoration: underline; text-underline-offset: 2px; }
.muted-note { color: var(--muted); font-size: 13px; margin-top: 14px; }
.section-count { color: var(--muted); font-size: 13px; margin: 0 0 10px; }
.filter-input { width: 100%; max-width: 480px; padding: .7rem .9rem; font-size: 15px; border: 1px solid var(--line); background: #fff; color: var(--ink); margin-bottom: 14px; }
.letter-nav { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 22px; }
.letter-nav a { display: inline-block; min-width: 26px; text-align: center; padding: 4px 6px; border: 1px solid var(--line); font-size: 12px; font-weight: 700; text-decoration: none; background: rgb(245,243,236); }
.letter-nav a:hover { border-color: var(--red); color: var(--red); }
.letter-heading { font-size: 22px; font-weight: 900; margin: 30px 0 10px; padding-top: 14px; border-top: 3px solid var(--ink); }
.letter-heading:first-of-type { border-top: none; padding-top: 0; }
.term-entry { background: rgb(245,243,236); border-left: 5px solid var(--line); padding: 14px 18px; margin-bottom: 10px; overflow-wrap: anywhere; }
.term-entry.js-hidden { display: none; }
.term-entry.cat-current { border-left-color: rgb(57,113,75); }
.term-entry.cat-legacy { border-left-color: rgb(155,110,20); }
.term-entry.cat-external { border-left-color: rgb(60,110,180); }
.term-entry.cat-unresolved { border-left-color: rgb(120,120,120); }
.term-entry.cat-ambiguous { border-left-color: var(--red); }
.term-entry.cat-other { border-left-color: var(--line); }
.term-row { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.term-name { font-size: 17px; font-weight: 900; }
.cat-badge { font-family: ui-monospace,Menlo,Consolas,monospace; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; padding: 2px 7px; border-radius: 3px; background: var(--line); color: rgb(50,55,52); }
.cat-current .cat-badge, .rule-cell .cat-badge.cat-current { background: rgb(203,233,211); color: rgb(30,85,48); }
.cat-legacy .cat-badge, .rule-cell .cat-badge.cat-legacy { background: rgb(255,228,157); color: rgb(110,75,10); }
.cat-external .cat-badge, .rule-cell .cat-badge.cat-external { background: rgb(200,224,255); color: rgb(20,65,125); }
.cat-unresolved .cat-badge, .rule-cell .cat-badge.cat-unresolved { background: rgb(222,222,222); color: rgb(70,70,70); }
.cat-ambiguous .cat-badge, .rule-cell .cat-badge.cat-ambiguous { background: rgb(255,193,180); color: rgb(135,40,20); }
.term-status { font-family: ui-monospace,Menlo,Consolas,monospace; font-size: 11px; color: var(--muted); margin-top: 4px; }
.term-desc { font-size: 14.5px; line-height: 1.55; margin: 8px 0 0; color: rgb(40,48,44); }
.term-source-block { margin-top: 8px; }
.src-line { font-size: 12px; color: var(--muted); word-break: break-all; }
.src-line a { text-decoration: underline; text-underline-offset: 2px; }
.pattern-entry { background: rgb(245,243,236); border-left: 5px solid var(--red); padding: 18px 22px; margin-bottom: 16px; }
.pattern-entry h3 { margin: 0 0 8px; font-size: 18px; letter-spacing: -0.01em; }
.pattern-entry p { font-size: 14px; line-height: 1.6; margin: 0 0 10px; color: rgb(40,48,44); }
.pattern-examples { font-size: 12px; color: var(--muted); line-height: 1.7; }
.pattern-examples .kv-label { text-transform: uppercase; letter-spacing: 0.06em; font-size: 10.5px; margin-right: 6px; }
.pattern-examples a { color: var(--red); text-decoration: underline; text-underline-offset: 2px; }
.ref-block { margin-bottom: 30px; }
.ref-block h4 { font-size: 15px; text-transform: uppercase; letter-spacing: .05em; color: var(--red); margin: 0 0 12px; }
.ref-block ul { padding-left: 20px; }
.ref-block li { font-size: 14px; line-height: 1.6; margin-bottom: 6px; }
.note-box { background: rgb(228,231,217); padding: 14px 18px; font-size: 13px; line-height: 1.55; margin-top: 10px; }
footer { color: #fff; background: rgb(16,23,19); padding: 46px 7vw; margin-top: 40px; font-size: 13px; line-height: 1.6; }
footer a { text-decoration: underline; text-underline-offset: 2px; }
@media (max-width: 760px) {
  .nav { height: 60px; }
  .intro, .section { padding-left: 6vw; padding-right: 6vw; }
  .rule-grid { grid-template-columns: 1fr 1fr; }
}
</style>
</head>
<body>

<nav class="nav" aria-label="Primary navigation">
  <a class="wordmark" href="../public-interest/index.html"><span>PI</span> PUBLIC INTEREST INVESTIGATIONS</a>
  <div class="navlinks">
    <a href="../public-interest/index.html">Investigations</a>
    <a href="../index.html">MAYHEM site</a>
  </div>
</nav>

<div class="intro">
  <p class="kicker">Ordinary Public Translation Layer &middot; Reference</p>
  <h1>Council language,<br>translated.</h1>
  <p class="lead">${esc(data.subtitle)}. Kempsey Shire Council material runs on hundreds of acronyms, codes and
  reference numbers that are rarely explained where they appear &mdash; some meaning two different things in
  different documents. This page is the plain-language key, checked against Council's own primary sources,
  term by term.</p>
  <nav class="page-nav" aria-label="On this page">
    <a href="#overview">Overview</a>
    <a href="#glossary">Alphabetical Glossary (${data.glossary.length})</a>
    <a href="#patterns">Patterns</a>
    <a href="#reference">Reference Notes</a>
    <a href="../public-interest/index.html">&larr; Why this exists</a>
  </nav>
</div>

<section class="section" id="overview">
  <h2>Overview</h2>
  ${renderOverview(data)}
</section>

<section class="section" id="glossary">
  <h2>Alphabetical Glossary</h2>
  ${renderGlossary(data)}
</section>

<section class="section" id="patterns">
  <h2>Patterns</h2>
  <p class="section-desc">Cross-entry patterns computed directly from the glossary above - not visible from any
  single term on its own. Every claim here is checkable against the specific terms it's built from, linked below
  each finding.</p>
  ${renderPatterns(data)}
</section>

<section class="section" id="reference">
  <h2>Reference Notes</h2>
  <p class="section-desc">Identifier families, code architectures and known term collisions that don't fit a
  single alphabetical entry.</p>
  ${renderReference(data)}
</section>

<footer>
  <div><a href="../public-interest/index.html">&larr; Public Interest Investigations</a> &middot; <a href="../index.html">MAYHEM Investigations (full site)</a></div>
  <div style="margin-top:8px;color:rgb(170,180,175);">Static-rendered from data.json at build time &mdash; every term above is real HTML, not loaded by JavaScript. The search box is a progressive enhancement only.</div>
</footer>

<script src="app.js"></script>
</body>
</html>
`;

fs.writeFileSync(OUT_PATH, html, 'utf8');
console.log('Wrote', OUT_PATH, `(${(html.length / 1024).toFixed(0)} KB, ${data.glossary.length} terms, ${data.referenceSections.length} reference sections)`);
