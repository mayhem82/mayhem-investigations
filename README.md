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
docs/
  specs/                 The governing specification (do not edit)
  DATA_MODEL.md          Concrete field schema, enums, and validation rules
scripts/
  validate.js            Structural validation (spec section 16)
site/                    Mobile-first Visual Workspace (spec sections 14-15)
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

## Current implementation status

Implemented so far (per the Implementation Order in spec section 21,
adapted to a from-scratch build with nothing to migrate):

- Case Definition (section 24)
- Evidence, Source, Chronology, Contradiction, Open Question, and
  Investigation Thread registers (sections 8-13), seeded with the twelve
  initial threads and otherwise empty pending evidence collection
- Structural validation rules (section 16)
- Mobile-first Visual Workspace covering Case Overview, Evidence Register,
  Chronology, Source Register, Contradiction Register, Open Questions, and
  Investigation Threads (sections 14-15)

Not yet implemented: document hashing tooling, automation/search logs,
decision register, change log, relationship map, and the remaining
sections of the specification (25-36 outside what's listed above).
