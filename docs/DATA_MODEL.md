# Data Model

This document defines the concrete field-level schema for the MAYHEM DFAPTI
investigation repository. It is the implementation of the structures
described in `docs/specs/MAYHEM-SPEC-DFAPTI-WATER-001-v2.0.md` sections 8-13,
24-26. The specification itself is implementation-independent (section 32);
this document fixes the concrete field names, types, and enumerations used
by the JSON data files in `data/` and by `scripts/validate.js`.

All data files are flat JSON arrays of records (except `case.json`, which is
a single object). Records are **append-only**: existing entries are never
edited or removed by automation. Corrections are made by adding a new
record that supersedes an earlier one and cross-referencing it — never by
mutating history in place.

---

## Case Definition (`data/case.json`)

Spec section 24. Single object. All fields are required and immutable for
the life of the investigation.

| Field | Type | Notes |
|---|---|---|
| `case_identifier` | string | `DFAPTI-BB-2026-00001`. Every other register's `case_id` field must match this value. |
| `case_title` | string | |
| `investigation_type` | string | |
| `jurisdiction` | string | |
| `geographic_scope` | string | |
| `commencement_date` | string (ISO 8601 date) | |
| `current_status` | string | Free text, e.g. `"Active - Evidence Collection Pending"`. |
| `investigator` | string | |
| `repository_version` | string (semver) | Bumped on structural repository changes (section 30 change log). |
| `specification_version` | string | Must match the spec file this repository implements. |

---

## Evidence Register (`data/evidence_register.json`)

Spec section 8. Array of evidence records. This is the primary factual
record — nothing here is edited or deleted once accepted; corrections
become new evidence items with an updated `relationships` link back to
what they correct.

| Field | Type | Notes |
|---|---|---|
| `evidence_id` | string | Format `EV-0001`, `EV-0002`, ... Permanent, never reused, never renumbered. |
| `case_id` | string | Must equal `case.json.case_identifier`. |
| `recording_date` | string (ISO date) | Date this evidence was entered into the register. |
| `source_date` | string (ISO date, or `"Unknown"`) | Date the underlying source material was produced. |
| `source_authority` | string | Who produced/published the source. |
| `source_title` | string | |
| `source_type` | enum | See **Source Classification** below (spec section 25). |
| `source_location` | string | URL or physical/file location. |
| `preserved_file_reference` | string \| `null` | Path to a locally preserved copy, if one exists. |
| `document_hash` | string \| `null` | SHA-256 of the preserved file. Required for accepted preserved documents unless `hash_exception_reason` is set (section 16). |
| `hash_exception_reason` | string \| `null` | Required if `document_hash` is null and the evidence is otherwise accepted (e.g. source has no fixed document, oral statement, live webpage with no snapshot capability). |
| `evidence_description` | string | |
| `relevant_quotation` | string \| `null` | Required whenever the evidence rests on a specific quoted passage. |
| `investigation_relevance` | string | Why this evidence matters to the case. |
| `classification` | enum | Evidentiary/preservation basis. See **Evidence Confidence** below (spec section 26). |
| `verification_state` | enum | `"Unverified"`, `"Requires Verification"`, `"Verified"`, `"Disputed"`, `"Accepted"`. |
| `relationships` | array of string | Related `evidence_id`s. |
| `chronology_links` | array of string | Related `chronology_id`s. |
| `contradiction_links` | array of string | Related `contradiction_id`s. |
| `open_question_links` | array of string | Related `question_id`s. |

**"Accepted" evidence** (informal rule from section 16, "accepted evidence
cannot possess zero proof-of-fact"): an evidence item with
`verification_state: "Accepted"` must have at least one of
`preserved_file_reference`, `document_hash`, or a non-empty `source_location`.

---

## Source Register (`data/source_register.json`)

Spec section 9. One record per approved source (a source may back multiple
evidence items).

| Field | Type | Notes |
|---|---|---|
| `source_id` | string | Format `SRC-0001`, ... Permanent. |
| `authority` | string | |
| `title` | string | |
| `type` | enum | See **Source Classification** below. |
| `url_or_file_location` | string | |
| `first_checked` | string (ISO date) | |
| `last_checked` | string (ISO date) | |
| `current_version` | string | Free text description of the version/revision last seen. |
| `preservation_status` | enum | `"Not Preserved"`, `"Partially Preserved"`, `"Preserved"`. |
| `hash_status` | enum | `"No Hash"`, `"Hash Pending"`, `"Hashed"`. |
| `associated_thread` | string \| `null` | `thread_id` this source primarily supports. |
| `availability_notes` | string \| `null` | |

---

## Chronology (`data/chronology.json`)

Spec section 10. Array of dated events. Confirmed and pending events are
distinguished by `status`. Later evidence may add refining entries but
never erases earlier ones.

| Field | Type | Notes |
|---|---|---|
| `chronology_id` | string | Format `CHR-0001`, ... Permanent. |
| `event_date` | string (ISO date, or approximate text) | |
| `date_is_inference` | boolean | `true` if the date is inferred rather than directly evidenced. |
| `event_description` | string | |
| `status` | enum | `"Confirmed"`, `"Pending"`. |
| `supporting_evidence` | array of string | `evidence_id`s. Must be non-empty. |

---

## Contradiction Register (`data/contradictions.json`)

Spec section 11.

| Field | Type | Notes |
|---|---|---|
| `contradiction_id` | string | Format `CTR-0001`, ... Permanent. |
| `description` | string | |
| `supporting_evidence` | array of string | `evidence_id`s. Must be non-empty. |
| `opposing_evidence` | array of string | `evidence_id`s. Must be non-empty. |
| `status` | enum | `"Open"`, `"Partially Resolved"`, `"Resolved"`, `"Unable to Resolve"`. |
| `material_significance` | string | Why the contradiction matters. |
| `required_resolution` | string | What evidence/action would resolve it. |
| `resolution_evidence` | array of string | `evidence_id`s. Required (non-empty) when `status` is `"Resolved"`. |

---

## Open Question Register (`data/open_questions.json`)

Spec section 12.

| Field | Type | Notes |
|---|---|---|
| `question_id` | string | Format `Q-0001`, ... Permanent. |
| `question` | string | The question itself. |
| `why_exists` | string | |
| `evidence_creating_question` | array of string | `evidence_id`s. |
| `evidence_required_to_resolve` | string | Description of what would resolve it. |
| `likely_source` | string | |
| `status` | enum | `"Open"`, `"Closed"`. |
| `resolution_evidence` | array of string | `evidence_id`s. Required (non-empty) when `status` is `"Closed"`. |

---

## Investigation Threads (`data/threads.json`)

Spec section 13. Seeded with the twelve initial threads named in the
specification. All start `"Not Started"` with no supporting evidence since
no collection has occurred yet.

| Field | Type | Notes |
|---|---|---|
| `thread_id` | string | Format `THR-01` .. `THR-12`, permanent. |
| `name` | string | One of the twelve initial thread names from spec section 13. |
| `status` | enum | `"Not Started"`, `"In Progress"`, `"Blocked"`, `"Complete"`. |
| `supporting_evidence` | array of string | `evidence_id`s. |
| `outstanding_work` | string | |
| `dependencies` | array of string | Other `thread_id`s this thread depends on. |
| `completion_state` | enum | `"Not Complete"`, `"Complete"`. |

---

## Relationship Map (`app.js`, `renderRelationshipMap`)

Spec section 14. There is no `data/relationships.json` — a Relationship
Map is a derived view, computed at render time from the cross-reference
fields that already exist on Evidence (`relationships`,
`chronology_links`, `contradiction_links`, `open_question_links`),
Chronology (`supporting_evidence`), Contradictions (`supporting_evidence`,
`opposing_evidence`, `resolution_evidence`), Open Questions
(`evidence_creating_question`, `resolution_evidence`), and Threads
(`supporting_evidence`, `dependencies`). Storing it separately would
create a second copy of the same facts that could drift out of sync with
the registers that are the actual source of truth.

---

## Preserved Sources (`preserved/`)

Supports spec section 18 ("Preserved Sources") and the `preserved_file_reference`
field on evidence. Locally preserved copies of source material (PDFs, page
snapshots, images, etc.) live in `preserved/`, named
`<evidence_id>-<short-slug>.<ext>` (e.g. `preserved/EV-0001-council-minutes.pdf`).
Evidence records reference them by relative path
(`preserved/EV-0001-council-minutes.pdf`). Files placed here are never
edited or replaced in place — a corrected copy is a new file referenced by
a new evidence record. See `preserved/README.md`.

---

## Automation Log (`data/automation_log.json`)

Spec sections 6-7. One record per automation execution (a human- or
script-triggered pass that checks sources and either files new evidence or
records that nothing changed — see section 7, "No Change Detected"). This
repository does not (yet) include a live scanning agent; `scripts/log-run.js`
lets an operator record a run by hand, in the same shape a future automated
runner would use.

| Field | Type | Notes |
|---|---|---|
| `run_id` | string | Format `RUN-0001`, ... Permanent. |
| `date` | string (ISO date) | |
| `sources_checked` | array of string | `source_id`s checked during this run. |
| `result` | enum | `"No relevant change detected."`, `"New evidence added."`, `"New source added."` |
| `evidence_added` | array of string | `evidence_id`s created by this run, if any. |
| `notes` | string \| `null` | |

## Search Log (`data/search_log.json`)

Spec section 27. One record per reproducible search performed while
collecting evidence.

| Field | Type | Notes |
|---|---|---|
| `search_id` | string | Format `SRCH-0001`, ... Permanent. |
| `search_terms` | string | |
| `search_engine` | string | |
| `database` | string \| `null` | |
| `date` | string (ISO date) | |
| `time` | string \| `null` | |
| `filters` | string \| `null` | |
| `jurisdiction` | string | |
| `results_reviewed` | integer | |
| `results_preserved` | integer | |

## Decision Register (`data/decisions.json`)

Spec section 29. Operational decisions about how the investigation is run,
kept separate from evidentiary findings.

| Field | Type | Notes |
|---|---|---|
| `decision_id` | string | Format `DEC-0001`, ... Permanent. |
| `date` | string (ISO date) | |
| `reason` | string | |
| `supporting_evidence` | array of string | `evidence_id`s, may be empty for process decisions with no evidentiary basis. |
| `investigator` | string | |
| `impact` | string | |

## Change Log (`data/change_log.json`)

Spec section 30. One record per structural repository change (schema
changes, new tooling, new registers) — not per evidence item, which is
already self-documenting via the Evidence Register.

| Field | Type | Notes |
|---|---|---|
| `change_id` | string | Format `CHG-0001`, ... Permanent. |
| `date` | string (ISO date) | |
| `author` | string | |
| `files_affected` | array of string | Relative paths. |
| `reason` | string | |
| `validation_completed` | boolean | Whether `scripts/validate.js` passed before this change was committed. |

## Investigation Notes (`data/investigation_notes.json`)

Spec section 14 ("Investigation Notes" workspace view). A live, append-only
working log of the investigation *as it happens* - what is currently being
researched, which source is being checked, and what was found or ruled
out - distinct from every other register in that it is not itself
evidence, a finding, or a decision. It exists so the workspace shows real
in-progress activity (spec section 15's "the investigation should resume
comfortably from mobile") rather than only a static end-of-session
summary. Notes are written progressively during a collection run, in the
order the work actually happened, and are never edited after the fact -
a correction is a new, later note.

| Field | Type | Notes |
|---|---|---|
| `note_id` | string | Format `NOTE-0001`, ... Permanent. |
| `timestamp` | string (ISO 8601 date-time) | Finer-grained than the daily `date` fields elsewhere, since several notes are typically written within one day. |
| `activity_type` | enum | `"Researching"`, `"Checking Source"`, `"Finding"`, `"Blocked"`, `"Decision"`, `"Note"`. |
| `text` | string | |
| `related_thread` | string \| `null` | `thread_id`, if this note relates to a specific thread. |
| `related_source` | string \| `null` | `source_id`, if this note relates to a specific source. |
| `related_evidence` | string \| `null` | `evidence_id`, if this note relates to a specific evidence item. |

---

## Source Classification (spec section 25)

Used for `evidence.source_type` and `source.type`:

`Legislation`, `Regulation`, `Government Record`, `Council Record`, `Policy`,
`Strategy`, `Planning Instrument`, `Court Decision`, `Scientific Publication`,
`Academic Literature`, `Media Report`, `Public Statement`,
`Community Submission`, `Mapping`, `Satellite Imagery`, `Photograph`,
`Video`, `Audio`, `Inspection Record`, `Correspondence`, `Other Public Record`.

## Evidence Confidence (spec section 26)

Used for `evidence.classification`. Relates only to preservation quality,
never to whether a conclusion is true:

`Original Available`, `Complete`, `Partial`, `Archived`,
`Secondary Reference`, `Requires Verification`.

---

## Validation Rules Implemented (spec section 16)

Enforced by `scripts/validate.js`:

1. Every required field on every record is present and non-empty.
2. `evidence_id`, `source_id`, `chronology_id`, `contradiction_id`,
   `question_id`, and `thread_id` are unique within their register.
3. Every `case_id` field equals `case.json.case_identifier`.
4. `chronology[].supporting_evidence` references only existing `evidence_id`s.
5. `contradictions[].supporting_evidence` / `opposing_evidence` reference
   only existing `evidence_id`s.
6. `open_questions[].resolution_evidence` and
   `evidence[].{relationships,chronology_links,contradiction_links,open_question_links}`
   reference only existing IDs in their respective registers.
7. `threads[].supporting_evidence` references only existing `evidence_id`s.
8. A question with `status: "Closed"` has a non-empty `resolution_evidence`.
9. A contradiction with `status: "Resolved"` has a non-empty `resolution_evidence`.
10. Evidence with `verification_state: "Accepted"` has non-zero
    proof-of-fact (a preserved file reference, document hash, or source
    location).
11. Evidence with a `document_hash` of `null` has a non-null
    `hash_exception_reason` if its `verification_state` is `"Accepted"`.
12. Enum fields (`status`, `classification`, `verification_state`,
    `source_type`/`type`, `preservation_status`, `hash_status`) contain only
    values listed in this document.
13. `automation_log.json[].sources_checked` and `.evidence_added` reference
    only existing `source_id`s / `evidence_id`s.
14. `decisions.json[].supporting_evidence` references only existing
    `evidence_id`s.
15. `change_log.json[].validation_completed` is a boolean.
16. Required fields on Automation Log, Search Log, Decision Register, and
    Change Log records are present and non-empty (arrays may be empty
    where the schema above allows it).
17. `investigation_notes.json[].activity_type` is one of the enumerated
    values, and `.related_thread` / `.related_source` / `.related_evidence`
    reference only existing IDs when present.

Validation never modifies data. It only reports pass/fail per rule per
record.

## Mutable vs. Append-Only Fields

Almost every field in this repository is append-only in the strict sense:
once written, never changed. Two registers have a small, explicitly-scoped
exception to support their stated purpose:

- **Source Register**: `last_checked`, `current_version`,
  `preservation_status`, and `hash_status` are updated in place each time a
  source is re-checked (`scripts/add-source.js`), because the Source
  Register's job (section 9) is to track the current state of a checked
  location, not to log history of checks. `source_id`, `authority`, `title`,
  `type`, `url_or_file_location`, and `first_checked` never change once set.
- Everything else — Evidence, Chronology, Contradictions, Open Questions,
  Threads, Automation Log, Search Log, Decisions, Change Log — is strictly
  append-only. Threads' `status`/`completion_state`/`supporting_evidence`
  are updated as work progresses (per section 13, threads track ongoing
  state), but this is done by hand with a corresponding Change Log entry,
  not silently.
- **Case Definition**: `current_status` and `repository_version` are
  legitimately mutable tracking fields, not part of the case's fixed
  identity — despite section 24 listing them alongside the truly immutable
  identifiers (`case_identifier`, `case_title`, `investigation_type`,
  `jurisdiction`, `geographic_scope`, `commencement_date`, `investigator`,
  `specification_version`, none of which ever change). Each change to
  `current_status` or `repository_version` is a deliberate edit,
  documented by its own Change Log entry - never a silent update.
