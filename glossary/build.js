#!/usr/bin/env node
/**
 * Static-render the glossary page from data.json.
 *
 * The previous version built all content client-side via fetch(data.json)
 * + JS DOM construction, which meant any tool that reads HTML without
 * executing JavaScript (search-engine crawlers that skip JS, link-preview
 * bots, other research tooling) saw an empty page. This script embeds the
 * full content directly into index.html at build time; app.js is now only
 * a thin progressive-enhancement layer for the live search filter.
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

function renderSource(sourceStr) {
  if (!sourceStr) return '<div class="glossary-source">-</div>';
  const parts = sourceStr.split(/\s*;\s*/);
  return parts.map((part) => {
    const m = part.match(/https?:\/\/\S+/);
    if (m) {
      let url = m[0].replace(/[)\].,]+$/, '');
      const prefix = part.slice(0, part.indexOf(url));
      return `<div class="glossary-source">${esc(prefix)}<a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a></div>`;
    }
    return part ? `<div class="glossary-source">${esc(part)}</div>` : '';
  }).join('');
}

function renderTermEntry(idPrefix, e) {
  const category = e.category || statusCategory(e.status);
  const searchText = esc(`${e.term} ${e.description} ${e.status}`.toLowerCase());
  return `
<div class="term-entry" id="${esc(idPrefix)}-${esc(slug(e.term))}" data-search="${searchText}">
  <div class="term-head"><strong>${esc(e.term)}</strong> <span class="cat-badge cat-${category}">${category}</span></div>
  ${e.status ? `<div class="record-sub">${esc(e.status)}</div>` : ''}
  <div class="term-desc">${esc(e.description)}</div>
  <div class="term-source"><span class="kv-label">Source</span>${renderSource(e.source)}</div>
</div>`;
}

function renderOverview(d) {
  const snap = d.snapshot;
  const rules = d.classificationRules.map((r) =>
    `<div><strong>${esc(r.tag)}</strong>: ${esc(r.meaning)}</div>`).join('\n');

  const deltas = d.researchDeltas.slice().reverse().map((delta) => `
<details class="record">
  <summary><div class="record-title">${esc(delta.snapshot)} — ${esc(delta.date)}</div><div class="record-sub">${delta.items.length} item(s)</div></summary>
  <div class="record-body"><ul>${delta.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>
</details>`).join('\n');

  const snapshotFiles = [2, 3, 4, 5, 6, 7, 8].map((n) => {
    const padded = String(n).padStart(3, '0');
    const dateMap = { '002': '20 Aug 2026', '003': '21 Aug 2026', '004': '21 Aug 2026', '005': '21 Aug 2026', '006': '21 Aug 2026', '007': '21 Aug 2026', '008': '21 Aug 2026' };
    const current = padded === '008' ? ' — current' : '';
    return `<div><a href="preserved/KSC-Master-Glossary-Snapshot-${padded}-2026-08-${padded === '002' ? '20' : '21'}.docx">Snapshot ${padded} (.docx, ${dateMap[padded]})${current}</a></div>`;
  }).join('\n');

  return `
<div class="card stack">
  <div class="kv-row"><div class="kv-label">Snapshot</div><div class="kv-value">${esc(snap.label)} (${esc(snap.id)})</div></div>
  <div class="kv-row"><div class="kv-label">Date frozen</div><div class="kv-value">${esc(snap.dateFrozen)}</div></div>
  <div class="kv-row"><div class="kv-label">Scope</div><div class="kv-value">${esc(snap.scope)}</div></div>
  <div class="kv-row"><div class="kv-label">Method</div><div class="kv-value">${esc(snap.method)}</div></div>
  <div class="kv-row"><div class="kv-label">Status</div><div class="kv-value">${esc(snap.status)}</div></div>
</div>
<h3 class="section-subtitle">Classification rules</h3>
<div class="card stack">${rules}</div>
<h3 class="section-subtitle">Research deltas by snapshot</h3>
<div class="stack">${deltas}</div>
<h3 class="section-subtitle">Preserved snapshot files</h3>
<div class="card stack">
${snapshotFiles}
<div class="record-sub">More snapshots will be added as further research sweeps arrive; each is kept alongside the ones before it rather than overwritten.</div>
</div>`;
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
<div class="section-count">${list.length} term(s)</div>
<input type="text" id="glossary-filter" class="filter-input" placeholder="Search terms, expansions, statuses..." aria-label="Search glossary" />
<div class="glossary-letter-nav">${letterNav}</div>
<div id="glossary-list">${entries.join('\n')}</div>`;
}

function renderReferenceSection(section) {
  if (section.type === 'terms') {
    const items = section.items.map((item) => `
<div class="term-entry">
  <div class="term-head"><strong>${esc(item.term)}</strong></div>
  ${item.status ? `<div class="record-sub">${esc(item.status)}</div>` : ''}
  <div class="term-desc">${esc(item.description)}</div>
  ${item.source ? `<div class="term-source"><span class="kv-label">Source</span>${renderSource(item.source)}</div>` : ''}
</div>`).join('\n');
    return `<div class="stack"><div class="record-sub">${esc(section.title)}</div>${items}</div>`;
  }
  const list = section.items.length
    ? `<ul>${section.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
    : '';
  const note = section.note ? `<div class="caveat">${esc(section.note)}</div>` : '';
  return `<div class="card"><h3>${esc(section.title)}</h3>${list}${note}</div>`;
}

function renderReference(d) {
  return d.referenceSections.map(renderReferenceSection).join('\n');
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="description" content="Kempsey Shire Council Master Glossary: terms, acronyms, codes and identifiers found in Council material, checked against primary sources, with known terminology collisions flagged. Shared reference for the MAYHEM investigations." />
<title>MAYHEM - KSC Master Glossary</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%92%A7%3C/text%3E%3C/svg%3E" />
<link rel="stylesheet" href="../style.css" />
<style>
  .glossary-letter-nav { display: flex; flex-wrap: wrap; gap: 0.3rem; margin: 0.75rem 0 1rem; }
  .glossary-letter-nav a {
    display: inline-block; min-width: 1.6rem; text-align: center; padding: 0.25rem 0.4rem;
    border: 1px solid var(--border); border-radius: 0.35rem; font-size: 0.82rem; font-weight: 700;
    color: var(--text); text-decoration: none; background: var(--surface);
  }
  .glossary-letter-nav a:hover { border-color: var(--accent); color: var(--accent); }
  .cat-badge { display: inline-block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.04em; padding: 0.15rem 0.5rem; border-radius: 999px; background: var(--badge-bg); }
  .cat-current { color: var(--confirmed); }
  .cat-legacy { color: var(--pending); }
  .cat-external { color: var(--focus); }
  .cat-unresolved { color: var(--unresolved); }
  .cat-ambiguous { color: var(--open); }
  .cat-other { color: var(--text-muted); }
  .letter-heading { font-size: 1.1rem; font-weight: 800; margin: 1.5rem 0 0.5rem; color: var(--accent); }
  .glossary-source a { word-break: break-all; }
  .term-entry { background: var(--surface); border: 1px solid var(--border); border-radius: 0.6rem;
    padding: 0.85rem 1rem; margin-bottom: 0.6rem; overflow-wrap: anywhere; }
  .term-entry.js-hidden { display: none; }
  .term-head { font-size: 1rem; margin-bottom: 0.2rem; }
  .term-desc { font-size: 0.92rem; margin: 0.35rem 0; }
  .term-source { margin-top: 0.4rem; }
  .page-nav { display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; margin: 0.5rem 0 1.5rem; font-size: 0.85rem; }
  .page-nav a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
</style>
</head>
<body>

<header class="app-header">
  <div class="app-header-row">
    <div class="app-header-title">
      <div class="app-name">MAYHEM &middot; Reference</div>
      <div class="case-id">KSC Master Glossary</div>
    </div>
  </div>
</header>

<main class="doc-page">
  <h1>${esc(data.title)}</h1>
  <p class="doc-subtitle">${esc(data.subtitle)}. Not tied to a single case &mdash; a shared reference for reading
  any Kempsey Shire Council material across this site. Built from operator-supplied research snapshots and
  updated as new snapshots arrive.</p>

  <nav class="page-nav" aria-label="On this page">
    <a href="#overview">Overview</a>
    <a href="#glossary">Alphabetical Glossary (${data.glossary.length})</a>
    <a href="#reference">Reference Notes</a>
    <a href="../index.html">&larr; MAYHEM Investigations</a>
  </nav>

  <h2 id="overview">Overview</h2>
  ${renderOverview(data)}

  <h2 id="glossary">Alphabetical Glossary</h2>
  ${renderGlossary(data)}

  <h2 id="reference">Reference Notes</h2>
  <p class="section-intro">Identifier families, code architectures and known term collisions that don't fit a
  single alphabetical entry.</p>
  ${renderReference(data)}

</main>

<footer class="app-footer">
  <div>Static-rendered at build time from data.json &mdash; content is present without JavaScript. The search
  box below uses JavaScript as a progressive enhancement only.</div>
</footer>

<script src="app.js"></script>
</body>
</html>
`;

fs.writeFileSync(OUT_PATH, html, 'utf8');
console.log('Wrote', OUT_PATH, `(${(html.length / 1024).toFixed(0)} KB, ${data.glossary.length} terms, ${data.referenceSections.length} reference sections)`);
