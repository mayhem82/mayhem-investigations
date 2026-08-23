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
const { CASES, ROOT } = require('../scripts/case-registry.js');

const mechanisms = JSON.parse(fs.readFileSync(path.join(__dirname, 'mechanisms.json'), 'utf8'));
const discovered = JSON.parse(fs.readFileSync(path.join(__dirname, 'discovered.json'), 'utf8'));

// Freeze dates come from each case's own SHM Gate data, not hardcoded here,
// so this list stays correct as cases are added or move to a new cycle.
const freezeDates = CASES.map((c) => {
  const gatePath = path.join(ROOT, 'cases', c.id, 'shm-gate', 'data.json');
  if (!fs.existsSync(gatePath)) return null;
  const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8'));
  return { id: c.id, date: gate.freeze_date, decision: gate.freeze_decision };
}).filter(Boolean);

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
<style>
:root { --ink: #17201c; --paper: #f2f0e9; --cream: #e8e4da; --acid: #d8ff3e; --red: #ef6045; --muted: #68716c; --line: #c8cbc3; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { background: var(--paper); color: var(--ink); margin: 0; font-family: Arial, Helvetica, sans-serif; }
a { color: inherit; }
.nav { border-bottom: 1px solid var(--line); backdrop-filter: blur(12px); z-index: 10; background: rgba(242,240,233,.94); justify-content: space-between; align-items: center; height: 68px; padding: 0 5vw; display: flex; position: sticky; top: 0; }
.wordmark { letter-spacing: .1em; align-items: center; gap: 10px; font-size: 13px; font-weight: 900; display: flex; text-decoration: none; color: var(--ink); }
.wordmark span { background: var(--ink); color: var(--acid); padding: 0 6px; height: 28px; display: grid; place-items: center; font-size: 11px; }
.navlinks { align-items: center; gap: 22px; font-size: 12px; font-weight: 700; display: flex; }
.navlinks a { text-decoration: none; }
.intro { padding: 56px 7vw 32px; max-width: 900px; }
.kicker { text-transform: uppercase; letter-spacing: .16em; font-size: 11px; font-weight: 800; color: var(--red); margin: 0 0 14px; }
.intro h1 { letter-spacing: -.03em; font-size: clamp(34px,5vw,58px); line-height: 1.03; margin: 0 0 16px; font-weight: 900; }
.intro p.lead { font-family: Georgia, serif; font-size: clamp(17px,1.6vw,21px); line-height: 1.5; color: rgb(56,67,62); max-width: 760px; margin: 0 0 18px; }
.doc-note { color: var(--muted); max-width: 760px; line-height: 1.6; margin: 0 0 14px; font-size: 14.5px; }
.doc-note strong { color: var(--ink); }
.section { padding: 24px 7vw 10px; max-width: 1000px; }
.section h2 { letter-spacing: -.03em; font-size: clamp(24px,3vw,34px); margin: 0 0 6px; }
.section-desc { color: var(--muted); max-width: 640px; line-height: 1.6; margin: 0 0 22px; }
.filter-input { width: 100%; max-width: 500px; padding: 12px 14px; border: 1px solid var(--line); background: #fff; font-size: 14px; font-family: inherit; margin-bottom: 24px; }
.term-entry { background: rgb(245,243,236); border-top: 5px solid var(--line); padding: 16px 20px; margin-bottom: 10px; overflow-wrap: anywhere; }
.term-entry.js-hidden { display: none; }
.term-entry.cat-A { border-top-color: var(--acid); }
.term-entry.cat-B { border-top-color: rgb(143,200,255); }
.term-entry.cat-C { border-top-color: rgb(255,180,90); }
.term-entry.cat-other { border-top-color: var(--red); }
.term-row { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.term-name { font-weight: 800; letter-spacing: -.01em; }
.cat-badge { display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; padding: 2px 8px; background: var(--cream); color: var(--muted); }
.term-desc { font-size: 15px; line-height: 1.55; margin-top: 8px; color: rgb(69,80,74); font-family: Georgia, serif; }
.term-status { font-size: 13.5px; color: var(--muted); margin-top: 8px; }
.src-line { font-size: 12.5px; color: var(--muted); margin-top: 8px; }
.src-line a { color: var(--red); text-decoration: underline; text-underline-offset: 2px; }
footer { color: #fff; background: rgb(16,23,19); padding: 46px 7vw; margin-top: 50px; font-size: 13px; line-height: 1.6; }
footer a { text-decoration: underline; text-underline-offset: 2px; }
@media (max-width: 760px) {
  .nav { height: 60px; }
  .intro, .section { padding-left: 6vw; padding-right: 6vw; }
  .term-entry { padding: 14px 16px; }
}
</style>
</head>
<body>

<nav class="nav" aria-label="Primary navigation">
<a class="wordmark" href="../index.html"><span>M</span> MAYHEM INVESTIGATIONS</a>
<div class="navlinks">
<a href="../public-interest/index.html">Public interest</a>
<a href="../glossary/index.html">Glossary</a>
<a href="../index.html">All cases</a>
</div>
</nav>

<header class="intro">
<p class="kicker">Reference &middot; Structural Harm Mechanism Catalogue</p>
<h1>${mechanisms.length} named patterns in how institutions produce harm while following their own rules.</h1>
<p class="lead">Operator-authored from pattern detection across past cases. Applied against real case evidence via
each case's own SHM Gate - never used to shape what evidence gets collected, only to check patterns against
evidence already frozen. This page is a living document: the "Discovered Through Investigation" section grows
every time a case surfaces a genuine pattern with no match here.</p>
<p class="doc-note"><strong>Interpretive layer, not a legal finding:</strong> every mechanism match applied
against a case is the operator's own structural interpretation of already-confirmed evidence - offered for
public scrutiny and further investigation, not asserted as a legal, regulatory, or judicial finding of
wrongdoing by any institution or individual. The evidence each match cites carries its own independent
verification status at the case level; the mechanism label is the analytical lens applied on top of it.</p>
<p class="doc-note"><strong>Scoped to each case's own evidence freeze date:</strong> ${freezeDates.map((f) =>
  `matches against ${f.id} reflect its register as frozen ${f.date} (${f.decision})`).join('; ')}. Relevant
developments may have occurred since that have not been checked against these matches and are not reflected in
them.</p>
</header>

<main class="section">
<input type="text" id="mech-filter" class="filter-input" placeholder="Search mechanisms..." aria-label="Search catalogue" />

<h2>Category A &mdash; ${CAT_LABEL.A} (${byCat.A.length})</h2>
<div id="cat-a-list">${renderMechList(byCat.A)}</div>

<h2>Category B &mdash; ${CAT_LABEL.B} (${byCat.B.length})</h2>
<div id="cat-b-list">${renderMechList(byCat.B)}</div>

<h2>Category C &mdash; ${CAT_LABEL.C} (${byCat.C.length})</h2>
<div id="cat-c-list">${renderMechList(byCat.C)}</div>

<h2>Discovered Through Investigation (${discovered.length})</h2>
<p class="section-desc">Not yet part of the canonical 68 - genuine patterns real cases surfaced with no clean match
above, offered back for the operator's own catalogue development.</p>
<div id="discovered-list">${renderDiscovered(discovered)}</div>

<h2>Where this is applied</h2>
<p class="section-desc">Each case's SHM Gate cross-references this catalogue against that case's own frozen DFAPTA
analysis, citing real evidence for every match: <a href="../cases/DFAPTI-BB-2026-00001/shm-gate/index.html">DFAPTI-BB-2026-00001</a>,
<a href="../cases/DFAPTI-MNC-2026-00001/shm-gate/index.html">DFAPTI-MNC-2026-00001</a>.</p>
</main>

<footer>
<a class="wordmark" href="../index.html" style="color:#fff"><span>M</span> MAYHEM INVESTIGATIONS</a>
<p style="margin-top:10px;color:rgb(170,180,175);">Structural Harm Mechanism Catalogue.</p>
</footer>

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
