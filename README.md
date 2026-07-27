# mayhem-investigations

Forensic public interest investigation workspace.

This repository is a persistent DFAPTI investigation engine, built to the
specification in [`docs/specs/MAYHEM-SPEC-DFAPTI-WATER-001-v2.0.md`](docs/specs/MAYHEM-SPEC-DFAPTI-WATER-001-v2.0.md).
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
docs/
  specs/                 The governing specification (do not edit)
  DATA_MODEL.md          Concrete field schema, enums, and validation rules
preserved/               Locally preserved copies of source material
scripts/
  validate.js            Structural validation (spec section 16)
  add-source.js          Add/re-check a source with stable identity (section 21.5)
  hash-file.js            Compute a document hash for preserved evidence (section 21.6)
  log-run.js               Append an Automation Log entry (sections 6-7)
  resume.js                 Print a resumption briefing (section 19)
site/                    Mobile-first Visual Workspace (spec sections 14-15, 19)
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

The workspace fetches the JSON files in `data/` at runtime, so it must be
served over HTTP (not opened as a `file://` page). From the repository
root:

```
python -m http.server 8123
```

then open `http://localhost:8123/site/` in a browser. It is designed
mobile-first: stacked layouts, no horizontal scrolling, expandable records.
The workspace opens on a **Resume** view (spec section 19) summarizing the
latest state of every register, with one-tap links into the full registers.

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

Implemented so far (per the Implementation Order in spec section 21,
adapted to a from-scratch build with nothing to migrate):

- Case Definition (section 24)
- Evidence, Source, Chronology, Contradiction, Open Question, and
  Investigation Thread registers (sections 8-13), seeded with the twelve
  initial threads and otherwise empty pending evidence collection
- Structural validation rules (section 16)
- Mobile-first Visual Workspace covering Resume, Case Overview, Evidence
  Register, Chronology, Source Register, Contradiction Register, Open
  Questions, and Investigation Threads (sections 14-15, 19)
- Stable source identity (`add-source.js`) and document hashing
  (`hash-file.js`) (section 21 items 5-6)
- Automation Log, Search Log, Decision Register, and Change Log
  (sections 6-7, 27, 29, 30), completing the repository structure listed
  in section 18
- Resumption Protocol, both as a CLI briefing (`resume.js`) and as the
  workspace's default view (section 19)

Not yet implemented: a Relationship Map view, and the largely narrative /
governance sections of the specification (17 security posture, 20 future
investigations, 28 spec version control, 31 glossary, 33-36 recovery,
scalability, constraints, and canonical-completeness statements) - these
describe principles the current structure already satisfies (append-only
data, validation, no reconstruction-from-memory) rather than additional
data structures to build.
