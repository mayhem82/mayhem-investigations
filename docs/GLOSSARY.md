# Glossary

Spec section 31 states that the specification "contains a canonical
glossary defining all core terms" and names eleven terms, but the
specification text itself (`docs/specs/MAYHEM-SPEC-DFAPTI-WATER-001-v2.0.md`)
does not include their definitions — only the list of names. This document
supplies those definitions, written to be consistent with how each term is
used throughout the specification and with how it is concretely implemented
in this repository (see `docs/DATA_MODEL.md`).

**Case**
The single, persistent unit of investigation. This repository operates
under one case, `DFAPTI-BB-2026-00001`, defined immutably in
`data/case.json` (spec section 24). All other registers are scoped to this
one case via their `case_id` field.

**Evidence**
A single piece of preserved primary-source material entered into the
Evidence Register (`data/evidence_register.json`, spec section 8), together
with the factual description, classification, and links that give it
investigative meaning. Evidence is append-only: an evidence item is never
edited or deleted once recorded, and its identifier is never reused.

**Source**
An approved origin of evidence — a document, publication, record, or other
public material — tracked once in the Source Register
(`data/source_register.json`, spec section 9) regardless of how many
evidence items are drawn from it. A source has a stable identity: the same
URL or file location always resolves to the same `source_id`
(`scripts/add-source.js`), even when re-checked on a later date.

**Finding**
A conclusion drawn from one or more evidence items — for example, a
confirmed chronology entry, a resolved contradiction, or an answered open
question. A finding is only as strong as the evidence it cites and must
always be traceable back to specific `evidence_id`s. This repository has no
separate "findings" register; findings are the confirmed/resolved states
recorded within the Chronology, Contradiction Register, and Open Question
Register once they cite supporting evidence.

**Relationship**
A cross-reference between two records — most often between an evidence
item and a chronology entry, contradiction, or open question it bears on,
but also between two evidence items, or between two investigation threads
(a dependency). Relationships are stored as ID references on the
individual records (e.g. `evidence.relationships`,
`contradiction.supporting_evidence`) rather than as a separate table. The
workspace's **Relationship Map** view computes and displays this network
on demand from those existing fields.

**Contradiction**
A recorded conflict between two or more pieces of evidence that cannot
both be straightforwardly true, tracked independently in the Contradiction
Register (`data/contradictions.json`, spec section 11) with its own status
(`Open`, `Partially Resolved`, `Resolved`, `Unable to Resolve`) separate
from the evidence items themselves.

**Thread**
An independent line of inquiry within the case — one of the twelve areas
listed in spec section 13 (e.g. Trucked water, Treatment plant,
Commissioning). Threads track status, supporting evidence, outstanding
work, and dependencies on other threads, and can each progress and close
independently of the others.

**Saturation**
The point at which further searching of a given source or thread is no
longer expected to surface new evidence — every reasonably available
avenue for that thread or source has been checked (see the Search
Reproducibility log, spec section 27, and a thread's `outstanding_work`
field). Saturation is a judgment the investigator records, not a status
the software can compute; it is noted in a thread's `outstanding_work` or
in a Decision Register entry when declared.

**Validation**
The automated structural check performed by `scripts/validate.js` against
the rules in spec section 16 — required fields present, identifiers
unique, cross-references resolvable, and the register-specific rules (e.g.
accepted evidence has proof-of-fact). Validation checks structure and
internal consistency; it says nothing about whether a conclusion is true.

**Preservation**
Keeping an independent, fixed copy of source material so that the
investigation does not depend on the source remaining available or
unchanged at its original location. Preserved copies live in `preserved/`
and are referenced from evidence via `preserved_file_reference`, ideally
alongside a `document_hash` (`scripts/hash-file.js`) proving the copy has
not changed since it was preserved.

**Archive**
The disposition of a case, thread, or specification version that is no
longer active but is deliberately retained rather than deleted. This
repository has no active archive yet (there is only one case, one thread
set, and one specification version); when a specification is superseded,
its file is kept in `docs/specs/` rather than removed (spec section 28),
and any future case that concludes would have its status set to an
archived value in `case.json.current_status` rather than being deleted.

**Reopening**
Returning to a thread, question, contradiction, or case that had
previously been marked complete/resolved/closed, because new evidence
bears on it. Reopening is done by adding a new evidence item and updating
the relevant record's status field (e.g. a question's `status` moving from
`Closed` back to `Open`) with a Change Log entry explaining why — never by
deleting the record of it having once been closed.
