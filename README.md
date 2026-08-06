# mayhem-investigations

Forensic public interest investigation workspace.

This repository is a persistent DFAPTI investigation engine, built to the
case-specific specification in
[`docs/specs/MAYHEM-SPEC-DFAPTI-WATER-001-v2.0.md`](docs/specs/MAYHEM-SPEC-DFAPTI-WATER-001-v2.0.md),
which is itself an instance of the general, reusable **[MAYHEM
specification](SPEC.md)** - the case-agnostic rules any MAYHEM-compliant
investigation repository follows, independent of subject matter or
implementation technology. Read [`SPEC.md`](SPEC.md) first if you're
starting a new investigation rather than continuing this one.

Its sole operational purpose is the active case:

**DFAPTI-BB-2026-00001** — Willawarrin / Bellbrook Recurring Drinking Water Failure

The repository *is* the investigation: evidence, chronology, contradictions,
open questions, and thread status are stored as append-only data files
directly in this repo, not in separate documents. See
[`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) for the field-level schema.

## Repository layout

```
data/                   Append-only investigation data (source of truth)
  case.json             Case Definition (spec section 24)
  evidence_register.json    Evidence Register (spec section 8)
  source_register.json      Source Register (spec section 9)
  chronology.json           Chronology (spec section 10)
  contradictions.json       Contradiction Register (spec section 11)
  open_questions.json       Open Question Register (spec section 12)
  threads.json               Investigation Threads (spec section 13)
  automation_log.json        Automation Log (spec sections 6-7)
  search_log.json            Search Log (spec section 27)
  decisions.json             Decision Register (spec section 29)
  change_log.json            Change Log (spec section 30)
  investigation_notes.json   Investigation Notes (spec section 14) - live
                             working log of research in progress
docs/
  specs/                 The governing specification (do not edit)
  DATA_MODEL.md          Concrete field schema, enums, and validation rules
  GLOSSARY.md            Canonical term definitions (spec section 31)
  GOVERNANCE.md          Security, future investigations, version control,
                         failure recovery, scalability, constraints, and
                         canonical completeness (spec sections 17, 20, 28, 33-36)
  RELATIONSHIP_MAP.md    Generated Mermaid diagrams of the cross-reference
                         graph (spec section 14/31) - do not hand-edit;
                         regenerate with scripts/generate-relationship-map.js
preserved/               Locally preserved copies of source material
scripts/
  validate.js            Structural validation (spec section 16)
  add-source.js          Add/re-check a source with stable identity (section 21.5)
  hash-file.js            Compute a document hash for preserved evidence (section 21.6)
  log-run.js               Append an Automation Log entry (sections 6-7)
  resume.js                 Print a resumption briefing (section 19)
  generate-relationship-map.js  Regenerate docs/RELATIONSHIP_MAP.md from the
                         same cross-reference logic app.js uses live
                         (section 14/31)
index.html, app.js,     Mobile-first Visual Workspace, including the
style.css                Relationship Map and Investigation Notes
                         (spec sections 14-15, 19) - served from the
                         repository root so the workspace is the site's
                         main page, not a subpage
```

## Validating the data

```
node scripts/validate.js
```

or

```
npm run validate
```

This checks required fields, ID uniqueness, cross-register references, and
the section 16 rules (e.g. accepted evidence must have proof-of-fact,
closed questions must cite resolving evidence). It never modifies data.

## Viewing the workspace

**Live:** every push to `main` deploys the workspace to GitHub Pages
(`.github/workflows/deploy-pages.yml`) at
**https://mayhem82.github.io/mayhem-investigations/** - the workspace itself
*is* that page, not something you're redirected to.

**Locally:** the workspace fetches the JSON files in `data/` at runtime, so
it must be served over HTTP (not opened as a `file://` page). From the
repository root:

```
python -m http.server 8123
```

then open `http://localhost:8123/` in a browser. It is designed
mobile-first: stacked layouts, no horizontal scrolling, expandable records.
The workspace opens on a **Resume** view (spec section 19) summarizing the
latest state of every register, with one-tap links into the full registers.
Every ID a register cites (`EV-0001`, `CHR-0002`, ...) is a real link that
jumps to and expands that record, and the URL updates to match
(`#evidence/EV-0001`) so a specific record can be bookmarked or shared
directly.

The **Investigation Notes** view polls `data/investigation_notes.json`
every 15 seconds while open, so if a collection run is appending notes
live while the page is open in a browser, new notes appear without a
reload - the closest a static site gets to "live" without a backend.

## Collection tooling

```
node scripts/add-source.js --authority "..." --title "..." --type "..." --url "..."
node scripts/hash-file.js preserved/EV-0001-example.pdf
node scripts/log-run.js --sources SRC-0001 --result "No relevant change detected."
node scripts/resume.js
```

`add-source.js` gives sources stable identity: re-running it with a URL
that's already registered updates that source's check-state fields in
place rather than creating a duplicate (spec section 21 item 5). Evidence
items themselves are still added by hand-editing
`data/evidence_register.json` and re-running `validate.js` - there is no
autogeneration of evidence, consistent with the Human Authority principle
(section 4).

## Current implementation status

This repository implements the full specification:

- Case Definition (section 24)
- Evidence, Source, Chronology, Contradiction, Open Question, and
  Investigation Thread registers (sections 8-13). Evidence collection is
  underway across three runs: 13 evidence items across 22 sources, 11
  chronology entries (spanning May 2022 to March 2025), and 6 open
  questions (one closed), covering the project's May 2022 origin, the
  2019-2020 drought/trucked-water episode, the 2024 mayoral transition,
  and the 2024-2025 Willawarrin treatment plant funding and construction
  start. The investigation now runs 15 threads - the original 12 plus 3 opened as
  evidence revealed new leads (a regional funding program, a
  Bellbrook-specific evidence gap, and a council leadership timeline
  needed for attribution), per the DFAPTI "all paths taken" methodology.
- Structural validation rules (section 16)
- Mobile-first Visual Workspace covering Resume, Case Overview, Evidence
  Register, Chronology, Source Register, Contradiction Register, Open
  Questions, Investigation Threads, the Relationship Map, and
  Investigation Notes (sections 14-15, 19)
- Stable source identity (`add-source.js`) and document hashing
  (`hash-file.js`) (section 21 items 5-6)
- Automation Log, Search Log, Decision Register, and Change Log
  (sections 6-7, 27, 29, 30), completing the repository structure listed
  in section 18
- Resumption Protocol, both as a CLI briefing (`resume.js`) and as the
  workspace's default view (section 19)
- Security, future investigations, specification version control,
  canonical terminology, failure recovery, scalability, architectural
  constraints, and canonical completeness (sections 17, 20, 28, 31, 33-36)
  written up in `docs/GOVERNANCE.md` and `docs/GLOSSARY.md`

Structural sections (8-16, 18, 24-27, 29-30) are enforced in code by
`scripts/validate.js` and rendered live in the workspace. Narrative /
governance sections (17, 20, 28, 31, 33-36) describe operating principles
this repository's design already satisfies; `docs/GOVERNANCE.md` states
each requirement alongside the concrete mechanism that enforces it.
