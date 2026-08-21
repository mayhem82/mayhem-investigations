#!/usr/bin/env node
/**
 * Static-render the Structural Harm Mechanism Catalogue from mechanisms.json
 * (the operator's 68 canonical mechanisms) + discovered.json (candidate
 * mechanisms surfaced through real MAYHEM case work - this file is meant to
 * grow every time an SHM Gate finds a genuine new pattern with no clean
 * match in the existing 68).
 *
 * Usage: node catalogue/build.js
 * Run after editing mechanisms.json or discovered.json.
 */
const fs = require('fs');
const path = require('path');

const mechanisms = JSON.parse(fs.readFileSync(path.join(__dirname, 'mechanisms.json'), 'utf8'));
const discovered = JSON.parse(fs.readFileSync(path.join(__dirname, 'discovered.json'), 'utf8'));

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

const CAT_LABEL = {
  A: 'Confirmed internal to canon',
  B: 'Additional internal to canon',
  C: 'Predicted from structural implication',
};

const byCat = { A: [], B: [], C: [] };
mechanisms.forEach((m) => byCat[m.category].push(m));
['A', 'B', 'C'].forEach((c) => byCat[c].sort((a, b) => a.no - b.no));

function renderMechList(list) {
  return list.map((m) => `
<div class="term-entry cat-${m.category}" id="mech-${m.no}" data-search="${esc((m.no + ' ' + m.name + ' ' + m.definition).toLowerCase())}">
  <div class="term-row"><span class="term-name">${m.no}. ${esc(m.name)}</span><span class="cat-badge">CATEGORY ${m.category}</span></div>
  <div class="term-desc">${esc(m.definition)}</div>
</div>`).join('\n');
}

function renderDiscovered(list) {
  if (!list.length) return '<p class="muted-note">None yet - this list grows as SHM Gates on future cases find genuine patterns with no match in the 68 above.</p>';
  return list.map((d) => {
    const fs_ = d.first_surfaced;
    const gateHref = `../cases/${fs_.case_id}/shm-gate/index.html`;
    return `
<div class="term-entry cat-other">
  <div class="term-row"><span class="term-name">${esc(d.working_name)}</span><span class="cat-badge">${esc((d.status || 'candidate').toUpperCase())}</span></div>
  <div class="term-desc">${esc(d.definition_from_case)}</div>
  <div class="term-status">${esc(d.boundary_note)}</div>
  <div class="term-source-block"><div class="src-line">First surfaced: <a href="${esc(gateHref)}">${esc(fs_.case_id)}</a>, path ${esc(fs_.path_id)}, ${esc(fs_.date)}</div></div>
</div>`;
  }).join('\n');
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="description" content="Structural Harm Mechanism Catalogue: ${mechanisms.length} named patterns in how institutions produce harm while following their own rules, plus mechanisms discovered through real MAYHEM investigations." />
<title>MAYHEM - Structural Harm Mechanism Catalogue</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%92%A7%3C/text%3E%3C/svg%3E" />
<link rel="stylesheet" href="../style.css" />
<style>
  .letter-nav { display: flex; flex-wrap: wrap; gap: 0.3rem; margin: 0.75rem 0 1rem; }
  .letter-nav a { display: inline-block; padding: 0.25rem 0.5rem; border: 1px solid var(--border); border-radius: 0.35rem; font-size: 0.8rem; font-weight: 700; color: var(--text); text-decoration: none; background: var(--surface); }
  .letter-nav a:hover { border-color: var(--accent); color: var(--accent); }
  .cat-badge { display: inline-block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 0.15rem 0.5rem; border-radius: 999px; background: var(--badge-bg); }
  .term-entry { background: var(--surface); border-left: 5px solid var(--border); border-radius: 0.4rem; padding: 0.85rem 1rem; margin-bottom: 0.6rem; overflow-wrap: anywhere; }
  .term-entry.js-hidden { display: none; }
  .term-entry.cat-A { border-left-color: var(--confirmed); }
  .term-entry.cat-B { border-left-color: var(--pending); }
  .term-entry.cat-C { border-left-color: var(--unresolved); }
  .term-entry.cat-other { border-left-color: var(--focus); }
  .term-row { display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
  .term-name { font-weight: 700; }
  .term-desc { font-size: 0.92rem; line-height: 1.55; margin-top: 0.35rem; }
  .term-status { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.4rem; }
  .src-line { font-size: 0.82rem; color: var(--text-muted); }
  .src-line a { color: var(--accent); text-decoration: underline; }
</style>
</head>
<body>

<header class="app-header">
  <div class="app-header-row">
    <div class="app-header-title">
      <div class="app-name">MAYHEM &middot; Reference</div>
      <div class="case-id">Structural Harm Mechanism Catalogue</div>
    </div>
  </div>
</header>

<main class="doc-page">
  <p><a class="jump-link" href="../index.html">&larr; MAYHEM Investigations</a></p>
  <h1>Structural Harm Mechanism Catalogue</h1>
  <p class="doc-subtitle">${mechanisms.length} named patterns in how institutions produce harm while following
  their own rules, operator-authored from pattern detection across past cases. Applied against real case evidence
  via each case's own SHM Gate - never used to shape what evidence gets collected, only to check patterns against
  evidence already frozen. This page is a living document: the "Discovered Through Investigation" section grows
  every time a case surfaces a genuine pattern with no match here.</p>

  <p class="doc-subtitle"><strong>Interpretive layer, not a legal finding:</strong> every mechanism match applied
  against a case is the operator's own structural interpretation of already-confirmed evidence - offered for
  public scrutiny and further investigation, not asserted as a legal, regulatory, or judicial finding of
  wrongdoing by any institution or individual. The evidence each match cites carries its own independent
  verification status at the case level; the mechanism label is the analytical lens applied on top of it.</p>

  <p class="doc-subtitle"><strong>Scoped to each case's evidence freeze date:</strong> matches against
  DFAPTI-MNC-2026-00001 reflect its register as frozen 17 August 2026; matches against DFAPTI-BB-2026-00001 reflect
  its register as frozen 6 August 2026. Relevant developments may have occurred since either date that have not
  been checked against these matches and are not reflected in them.</p>

  <input type="text" id="mech-filter" class="filter-input" placeholder="Search mechanisms..." aria-label="Search catalogue" />

  <h2>Category A &mdash; ${CAT_LABEL.A} (${byCat.A.length})</h2>
  <div id="cat-a-list">${renderMechList(byCat.A)}</div>

  <h2>Category B &mdash; ${CAT_LABEL.B} (${byCat.B.length})</h2>
  <div id="cat-b-list">${renderMechList(byCat.B)}</div>

  <h2>Category C &mdash; ${CAT_LABEL.C} (${byCat.C.length})</h2>
  <div id="cat-c-list">${renderMechList(byCat.C)}</div>

  <h2>Discovered Through Investigation (${discovered.length})</h2>
  <p>Not yet part of the canonical 68 - genuine patterns real cases surfaced with no clean match above, offered
  back for the operator's own catalogue development.</p>
  <div id="discovered-list">${renderDiscovered(discovered)}</div>

  <h2>Where this is applied</h2>
  <p>Each case's SHM Gate cross-references this catalogue against that case's own frozen DFAPTA analysis, citing
  real evidence for every match: <a href="../cases/DFAPTI-BB-2026-00001/shm-gate/index.html">DFAPTI-BB-2026-00001</a>,
  <a href="../cases/DFAPTI-MNC-2026-00001/shm-gate/index.html">DFAPTI-MNC-2026-00001</a>.</p>
</main>

<script>
(function () {
  var input = document.getElementById('mech-filter');
  var containers = ['cat-a-list', 'cat-b-list', 'cat-c-list'].map(function (id) { return document.getElementById(id); });
  input.addEventListener('input', function () {
    var q = input.value.trim().toLowerCase();
    containers.forEach(function (c) {
      Array.prototype.forEach.call(c.children, function (child) {
        var text = child.getAttribute('data-search') || '';
        child.classList.toggle('js-hidden', q.length > 0 && text.indexOf(q) === -1);
      });
    });
  });
})();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'index.html'), html, 'utf8');
console.log('Wrote catalogue/index.html', mechanisms.length, 'mechanisms,', discovered.length, 'discovered');
