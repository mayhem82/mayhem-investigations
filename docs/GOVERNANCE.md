# Governance

This document implements the narrative and governance sections of
`docs/specs/MAYHEM-SPEC-DFAPTI-WATER-001-v2.0.md` that describe operating
principles rather than data structures: sections 17, 20, 28, and 33-36.
Each section below states the specification's requirement, then how this
repository concretely satisfies it.

---

## Section 17 — Security

> Private investigation records must not be described as private while
> publicly accessible. Public outputs remain separate from working
> investigation records. Verification status must always remain visible.
> No interface may imply evidence certainty beyond recorded classification.

**In this repository:**

- This repository has no separate "public" output at all — the git
  repository *is* the working investigation record, in full, or it is
  nothing. There is currently no summarized/redacted public-facing
  document generated from it. If one is ever produced (e.g. a public
  report), it must be a distinct file or repository, never described as
  showing "the whole investigation," and must not be confused with this
  working record.
- Whether this repository itself is public or private is a decision for
  the operator (a GitHub visibility setting), not something this
  documentation can enforce. Whatever the setting, it must be described
  accurately — a private repository must not be claimed private if its
  visibility is actually public, and vice versa.
- `verification_state` is a required field on every evidence item
  (`docs/DATA_MODEL.md`) and is always rendered as a visible badge on every
  Evidence Register card in the workspace (`app.js`,
  `renderEvidence`) — it is never hidden or summarized away.
- The workspace only ever renders the literal field values recorded
  (`classification`, `verification_state`, `status`) as badges. It never
  generates narrative language ("this is confirmed," "this is proven")
  beyond those recorded values — `scripts/validate.js` also rejects invalid
  enum values, so a badge can never silently claim a certainty level that
  wasn't actually recorded.

---

## Section 20 — Future Investigations

> Additional investigations remain possible. However: new investigations
> are never automatically created. Every future investigation receives a
> unique case identifier, independent evidence register, independent
> chronology, independent contradiction register, independent thread
> structure, and independent automation state. Cases remain completely
> isolated.

**In this repository:**

- Nothing in this repository creates a case automatically. There is no
  scheduled task, script, or automation that generates a new
  `case_identifier` — every case's own `case_id` field in every register is
  validated against that case's own `case.json` (`scripts/validate.js`,
  iterating the registered case list in `scripts/case-registry.js`), which
  structurally *prevents* one case's data from being recorded under
  another case's identifier by accident.
- This repository's architecture is modular and multi-case by design (see
  `SPEC.md` §3, "Case Isolation Discipline" — this document's reference to
  spec section 3 originally described the single-case predecessor spec,
  `docs/specs/MAYHEM-SPEC-DFAPTI-WATER-001-v2.0.md`; the repository has
  since grown past that single-case constraint and `SPEC.md`, the current
  case-agnostic specification, reflects that). Each investigation lives
  under its own `cases/<CASE-ID>/` directory (or the repository root, for
  the original case) with a fully independent `data/case.json`,
  `case_identifier`, evidence register, chronology, contradiction
  register, thread structure, and automation state — never a shared
  `data/` directory across cases, and no case's automation acts on
  another's data. What "cases remain completely isolated" requires is that
  isolation, not a one-repository-per-case rule.
- This is a decision for the operator to make explicitly (see
  `data/decisions.json`), never something this codebase does on its own.

---

## Section 28 — Version Control

> The specification itself maintains: Version Number, Revision Date,
> Revision Summary, Compatibility Statement, Superseded Versions.
> Historical specifications remain preserved.

**In this repository:**

| Version | Revision Date | Revision Summary | Compatibility Statement | Superseded Versions |
|---|---|---|---|---|
| MAYHEM-SPEC-DFAPTI-WATER-001-v2.0 | 2026-07-25 | Governing specification for this repository as built. | This is the only version this repository has ever implemented; nothing here is required to be compatible with any other version. | None retained in this repository. Prior versions (e.g. a v1.0) are not present here — only the version that governs the current build is kept. |

Convention going forward: `docs/specs/` never has a file removed. If this
specification is revised, the new file is added under a new filename
(carrying its own version in the name, as this one does) and the
superseded file is left in place, not deleted. `data/case.json`'s
`specification_version` field is updated to point at whichever version
currently governs the repository, and that change is recorded in
`data/change_log.json` (spec section 30).

---

## Section 33 — Failure Recovery

> If interrupted, the investigation resumes from the last validated state.
> Recovery verifies: Evidence Register, Source Register, Chronology,
> Relationships, Validation status, Open Questions. No reconstruction
> relies on memory.

**In this repository, recovery after any interruption is:**

1. `node scripts/validate.js` — confirms the Evidence Register, Source
   Register, Chronology, cross-register Relationships, and Open Question
   Register are all structurally intact and internally consistent (spec
   section 16 rules). A clean exit (code 0) is confirmation of "last
   validated state."
2. `node scripts/resume.js`, or opening the workspace's **Resume** view —
   displays the latest evidence, chronology, open contradictions,
   unresolved questions, and active threads directly from the data files
   on disk.

Nothing about resuming work depends on remembering what was previously
done — both tools read the same files that `git log` and every prior
commit already preserved. There is no separate memory, cache, or session
state anywhere in this repository that recovery could lose.

---

## Section 34 — Scalability

> The architecture supports: single investigations, multiple concurrent
> investigations, multi-jurisdiction repositories, cross-referenced cases,
> long-running investigations. Each investigation remains logically
> isolated.

**In this repository:**

This repository currently implements multiple concurrent investigations —
`DFAPTI-BB-2026-00001`, `DFAPTI-MNC-2026-00001`, `DFAPTI-BB-FF-2026-00001`,
`DFAPTI-BB-LW-2026-00001`, and `DFAPTI-TA-FF-2026-00001` — each logically
isolated per the pattern described in section 20 above: its own
`case_identifier`, evidence register, chronology, contradiction register,
thread structure, and automation state, scoped to its own `cases/<CASE-ID>/`
directory (or the repository root, for the original case) and validated
independently. Two of these cases (`DFAPTI-BB-FF-2026-00001` and
`DFAPTI-MNC-2026-00001`) currently run their own separate scheduled
automation routines, each operating only on its own case's data.

Each register being scoped to a single `case_id` and validated against
exactly one `case.json` per case is what makes this multi-case operation
safe within a single repository, rather than a reason multiple concurrent
investigations would require separate repositories.

---

## Section 35 — Architectural Constraints

> The system shall never: alter preserved evidence, reuse evidence
> identifiers, delete audit history, merge unrelated investigations, hide
> validation failures, modify chronology without recording the change.
> These constraints are invariant.

**In this repository, each constraint is enforced concretely, not just
aspirationally:**

| Constraint | Enforcement mechanism |
|---|---|
| Never alter preserved evidence | No script in `scripts/` edits or deletes an existing entry in `evidence_register.json`. `preserved/README.md` states files there are never edited in place. Corrections require a *new* evidence item. |
| Never reuse evidence identifiers | `scripts/validate.js` (`checkUnique`) rejects any duplicate `evidence_id`; the ID scheme (`EV-0001`, `EV-0002`, ...) is always assigned as `max + 1`, never reassigned. |
| Never delete audit history | Git history is the audit trail — nothing in this repository force-rewrites commits. `data/change_log.json` additionally records every structural change in the data itself, independent of git. |
| Never merge unrelated investigations | Every register's `case_id` must equal that case's own `case.json.case_identifier`; `scripts/validate.js` validates each registered case independently and fails the build if it doesn't, which structurally prevents another case's records from being merged in. |
| Never hide validation failures | `scripts/validate.js` prints every failing rule by name and exits with a non-zero status; there is no "warnings only" or suppressed mode. |
| Never modify chronology without recording the change | `data/chronology.json` is append-only (new entries only); any change to the chronology's structure or an existing entry's status is itself recorded as a `data/change_log.json` entry, per spec section 30. |

---

## Section 36 — Canonical Completeness

> This specification is intended to function as the complete architectural
> definition of the Forensic Public Sourced Investigations engine. A
> compliant implementation shall be constructible from this specification
> alone... Future revisions may extend the specification but shall
> preserve backward compatibility unless an explicit breaking revision is
> declared.

**In this repository:**

The specification is deliberately implementation-independent (section
32) — it defines *what* must exist and behave a certain way, not the exact
field names or file formats. `docs/DATA_MODEL.md` is the concrete layer
this repository adds on top: field names, types, enumerations, and ID
formats for every register the specification names. That layer, plus this
document and the glossary, is intended to make this repository fully
reconstructible from the specification and these three documents alone —
no undocumented conventions or tribal knowledge required.

If `MAYHEM-SPEC-DFAPTI-WATER-001-v2.0` is ever superseded by a revision,
this repository's data model is expected to remain valid against it unless
that revision explicitly declares itself breaking (per the compatibility
statement above and in section 28). Any such revision would be preserved
in `docs/specs/` alongside this one, never in its place.
