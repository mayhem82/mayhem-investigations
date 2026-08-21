# mayhem-investigations

Forensic public interest investigation workspace.

This repository is the canonical home of **MAYHEM** (Modular Audit and
Yield for Humans Enforcement Mechanism) - not a demo copy or one instance
among many. The general, case-agnostic rules are in
**[`SPEC.md`](SPEC.md)**; this repository's active case implements them
per [`docs/specs/MAYHEM-SPEC-DFAPTI-WATER-001-v2.0.md`](docs/specs/MAYHEM-SPEC-DFAPTI-WATER-001-v2.0.md).
Read `SPEC.md` first if you're starting a new investigation rather than
continuing this one.

The output that matters is `cases/<CASE-ID>/enforcement-notice/` - a real,
submission-ready complaint to bodies with actual jurisdiction, built on
the evidence register beneath it. Nothing about the document compels a
response by itself; what it's built on is what gives it whatever weight
it carries when someone actually sends it - see that page's own
Recipients section for what's real and what's a placeholder.

Its active cases:

**DFAPTI-BB-2026-00001** — Willawarrin / Bellbrook Recurring Drinking Water Failure.
Live through all six stages.

**DFAPTI-MNC-2026-00001** — Mid North Coast PolAir-Remote Drone Expansion,
Kempsey Petition Evidentiary Audit. Live at Stage 1 (DFAPTI) only; Stages
2-6 are locked pending an explicit evidence-freeze command for this case.
Its initial evidence base was ingested from an external ChatGPT Deep
Research investigation and is recorded `verification_state: "Unverified"`
throughout pending independent confirmation - see its own Decision
Register (`DEC-0001`).

The repository *is* the investigation: evidence, chronology, contradictions,
open questions, and thread status are stored as append-only data files
directly in this repo, not in separate documents. See
[`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) for the field-level schema.

Every case runs the same six-stage site structure - evidence, analysis,
cross-pattern view, forward assessment, formal complaint, how to use it -
under `cases/<CASE-ID>/`, so the structure doesn't need re-deriving each
time a case is added. **The evidence data layer is per-case**:
`cases/<CASE-ID>/data/`, registered by data directory in
[`scripts/case-registry.js`](scripts/case-registry.js), which
`scripts/validate.js` and `scripts/generate-relationship-map.js` iterate
over independently per case. DFAPTI-BB-2026-00001 is the one grandfathered
exception - its data stays at the repository root (`data/`), where it was
before a second case existed, rather than being moved and rewriting every
already-committed cross-reference for no functional benefit. Every case
added after it follows the per-case pattern; a case never gets its own
repository - see the standing "mayhem investigations only" operating
constraint this repository is built under.

## Repository layout

```
data/                   DFAPTI-BB-2026-00001's data (grandfathered at the
                         repository root - see the architecture note above)
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
                         graph (spec section 14/31), one section per case -
                         do not hand-edit; regenerate with
                         scripts/generate-relationship-map.js
preserved/               DFAPTI-BB-2026-00001's locally preserved source copies
scripts/
  case-registry.js       Every case's data directory - the single source of
                         truth validate.js, generate-relationship-map.js,
                         resume.js, add-source.js, and log-run.js read from
  validate.js            Structural validation (spec section 16), run
                         independently per registered case
  add-source.js          Add/re-check a source with stable identity (section
                         21.5); takes --case CASE-ID, defaults to DFAPTI-BB-2026-00001
  hash-file.js            Compute a document hash for preserved evidence (section 21.6)
  log-run.js               Append an Automation Log entry (sections 6-7);
                         takes --case CASE-ID
  resume.js                 Print a resumption briefing (section 19); takes
                         --case CASE-ID
  generate-relationship-map.js  Regenerate docs/RELATIONSHIP_MAP.md from the
                         same cross-reference logic app.js uses live
                         (section 14/31), for every registered case
style.css                Shared stylesheet for every page below
index.html               Case list - the site root, links into each case
cases/
  DFAPTI-BB-2026-00001/  Six stages, live throughout, plus its own gate page
    index.html           Case gate page - links to the six stages below
    dfapti/              Stage 1 (evidence): app.js + index.html, the
                         Mobile-first Visual Workspace - Resume, Case
                         Overview, Evidence Register, Chronology, Source
                         Register, Contradiction Register, Open Questions,
                         Actions to Take, Investigation Threads,
                         Relationship Map, and Investigation Notes (spec
                         sections 14-15, 19). Fetches data/ three levels up
                         (repository root - this case's grandfathered path).
    dfapta/              Stage 2 (analysis): patterns read across a frozen
                         evidence-register snapshot, not new evidence
    lattice-atlas/       Stage 3: cross-thread pattern view over this
                         case's own evidence
    temporal-projection-integrity-engine/
                         Stage 4: forward assessment, framed as reasoned
                         judgement with its evidentiary basis stated, not
                         as a certainty score
    enforcement-notice/  Stage 5: the submission-ready formal complaint
    advocacy-package/    Stage 6: recipients, how to submit, how to log
                         responses, and how to verify any finding yourself
  DFAPTI-MNC-2026-00001/ Live at Stage 1 only - the per-case data/ pattern
    index.html           Case gate page - Stage 1 live, Stages 2-6 shown
                         locked pending an evidence freeze for this case
    data/                This case's own registers, same schema as above -
                         the pattern every case after DFAPTI-BB-2026-00001 uses
    preserved/           This case's preserved source material (an external
                         deep-research corpus, not independently fetched -
                         see its own data/decisions.json DEC-0001)
    dfapti/              Stage 1, identical mechanism to DFAPTI-BB-2026-00001's,
                         fetching ../data/ (one level up - this case's own
                         data directory, not the repository root)
```

Adding a case: create `cases/<CASE-ID>/` with a `data/` directory holding
the same eleven files as above (`case.json` through
`investigation_notes.json`), register that directory in
`scripts/case-registry.js`, build at minimum the `dfapti/` stage (clone an
existing case's `dfapti/index.html` and `app.js`, adjusting only the
`DATA_PATHS` fetch prefix and the header case ID - never its mechanism),
add a card for it to the root `index.html`, and add a case-level
`index.html` (copy an existing case's `index.html`, showing later stages
as `.landing-card.locked` divs until this case's own evidence is frozen -
see DFAPTI-MNC-2026-00001's `index.html` for the pattern). Only build
Stages 2-6 for a case once its operator issues an explicit evidence-freeze
command for that case; never self-authorize a freeze.

Each stage is a self-contained page under `cases/<CASE-ID>/`, sharing the
root `style.css` and linked from a consistent top nav bar (All Cases → this
case → the six stages). `index.html` at the repository root is the case
list, not any one case's workspace.

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

**Live:** every push to `main` deploys the whole site to GitHub Pages
(`.github/workflows/deploy-pages.yml`) at
**https://mayhem82.github.io/mayhem-investigations/** - the case list.
Each case's evidence workspace is at
**https://mayhem82.github.io/mayhem-investigations/cases/&lt;CASE-ID&gt;/dfapti/**,
e.g. `.../cases/DFAPTI-BB-2026-00001/dfapti/` or
`.../cases/DFAPTI-MNC-2026-00001/dfapti/`.

Two more pages sit alongside the cases, not tied to either one:
**https://mayhem82.github.io/mayhem-investigations/public-interest/** - the
Ordinary Public Translation Layer, plain-language summaries of both cases for
readers who don't want the underlying registers - and
**https://mayhem82.github.io/mayhem-investigations/glossary/** - the Kempsey
Shire Council Master Glossary, terms/acronyms/codes/identifiers checked
against primary sources, with known terminology collisions flagged.

**Locally:** each case's workspace fetches its own case's JSON files at
runtime (`data/` at the repository root for DFAPTI-BB-2026-00001,
`cases/<CASE-ID>/data/` for every case after it), so it must be served
over HTTP (not opened as a `file://` page). From the repository root:

```
python -m http.server 8123
```

then open `http://localhost:8123/` for the case list, or
`http://localhost:8123/cases/<CASE-ID>/dfapti/` directly for a specific
case's workspace. It is designed
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
node scripts/add-source.js --authority "..." --title "..." --type "..." --url "..." [--case CASE-ID]
node scripts/hash-file.js preserved/EV-0001-example.pdf
node scripts/log-run.js --sources SRC-0001 --result "No relevant change detected." [--case CASE-ID]
node scripts/resume.js [--case CASE-ID]
```

`--case` defaults to `DFAPTI-BB-2026-00001` if omitted; pass e.g.
`--case DFAPTI-MNC-2026-00001` to operate on another registered case (see
`scripts/case-registry.js`). `add-source.js` gives sources stable
identity: re-running it with a URL that's already registered updates that
source's check-state fields in place rather than creating a duplicate
(spec section 21 item 5). Evidence items themselves are still added by
hand-editing that case's `evidence_register.json` and re-running
`validate.js` - there is no autogeneration of evidence, consistent with
the Human Authority principle (section 4).

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
