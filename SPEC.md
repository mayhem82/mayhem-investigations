---
spec_name: "MAYHEM"
spec_full_name: "Modular Audit and Yield for Humans Enforcement Mechanism"
spec_document: "MAYHEM-SPEC-CORE"
spec_version: "1.0.0"
status: "Open Standard"
derived_from: "docs/specs/MAYHEM-SPEC-DFAPTI-WATER-001-v2.0.md"
---

# MAYHEM

**Modular Audit and Yield for Humans Enforcement Mechanism**

## What this document is

This is the general, case-agnostic specification for a **MAYHEM-compliant investigation
repository** — a persistent, evidence-first, forensic investigation engine that keeps
a single investigation permanently continuable across sessions, contributors, and time.

It is derived from the operational specification originally written for one specific
case (`docs/specs/MAYHEM-SPEC-DFAPTI-WATER-001-v2.0.md`, a Willawarrin/Bellbrook
drinking-water investigation). That document remains as the historical record of the
exact spec version this repository's own investigation was built against. This
document extracts the same rules with the case-specific material removed, so they can
be reused to start a new, unrelated investigation.

A repository that follows every rule in this document is **MAYHEM-compliant**,
regardless of subject matter, jurisdiction, or implementation technology.

---

## 1. Purpose

A MAYHEM repository is not a general-purpose research wiki, a public-intelligence
dashboard, or a scratch space for notes. Its sole operational purpose is to maintain
**one persistent forensic investigation** while preserving every stage of evidence
collection, so that:

- the repository *is* the investigation, not a description of it;
- no separate investigation document is ever required to know what has been found or
  what remains open;
- work can stop and resume — across days, sessions, or contributors — without loss of
  continuity or re-derivation of prior findings.

## 2. Investigation Objective

Every MAYHEM investigation exists to establish a complete, source-verified account of
a defined factual matter. The specific objective (what is being investigated, and
why) is defined once, at case creation, and does not change without an explicit,
recorded scope decision (see §4, Controlled Scope). Every conclusion the investigation
reaches must remain supported by preserved primary-source evidence — never by
inference alone, and never by the investigator's or an automated agent's unsupported
assertion.

## 3. Architectural Change (Case Isolation Discipline)

MAYHEM is a **modular** audit mechanism: a repository supports one or more
operational investigations, run concurrently where useful, each **fully isolated**
from every other — its own evidence register, chronology, threads, and automation
state, with nothing shared or blended across cases. This is a deliberate constraint,
not a limitation of convenience: it prevents partial attention within a given case,
cross-contamination between unrelated matters, and the temptation to let automation
silently broaden a case's own scope, or to let one case's automation act on another.
A repository may host further investigations over its lifetime (see §20) and run
several at once (§34); what never happens is two cases sharing state, or automation
creating a new case on its own initiative.

## 4. Design Principles

These principles are permanent and apply to every MAYHEM investigation:

- **Case Isolation** — a repository may run one investigation or several
  concurrently; each is fully isolated from every other (its own evidence,
  chronology, threads, and automation state) and none share or blend state with
  another.
- **Persistent Investigation** — the investigation never resets; state accumulates,
  it is not recomputed from scratch each session.
- **Append-Only Evidence** — evidence is never overwritten, renumbered, or silently
  modified. Corrections become new evidence entries that reference what they correct.
- **Source Before Analysis** — primary source material is preserved (and hashed,
  where the material is a fetchable document) before analytical interpretation is
  written down.
- **Controlled Scope** — the investigation never expands itself beyond
  operator-defined scope. An automated agent does not decide to investigate something
  new; a human does.
- **Human Authority** — only the operator (the accountable human running the
  investigation) determines investigation scope, case creation, evidence acceptance
  policy, thread closure, and investigation completion. Automation proposes; the
  operator decides.
- **Language Discipline** — every finding describes documented record or structural
  behavior, never intent, motive, or a legal conclusion (unlawful, breach, negligent)
  the investigation has no authority to reach. Nothing is described with more
  certainty than its verification status supports. MAYHEM's own remedy-demand
  document (Enforcement Notice) is never described as a complaint — it demands
  specific, binding action; it does not ask an institution to investigate itself.
  This applies everywhere a finding or a stage is described, not only in the
  document where it is stated most formally — a front-page summary sentence or a
  case's own meta description is just as much a place this can drift as the finding
  itself.

## 5. Removed Capabilities

A MAYHEM investigation repository is explicitly **not**:

- a general intelligence-collection or monitoring platform;
- an automatic target-generation or mass-investigation-creation system;
- a heat-score dashboard, ranking system, or public allegation system;
- an automatic keyword-triggered investigation spawner.

None of this machinery runs during routine operation. If a repository is adapted from
a broader platform, these capabilities must be disabled, not merely unused.

## 6. Permitted Automation

Automated or AI-assisted evidence-collection passes exist only to continue the
current investigation. Every pass performs the following sequence, in order:

1. Load the investigation (case definition).
2. Load all evidence.
3. Load chronology.
4. Load contradictions.
5. Load unresolved (open) questions.
6. Load investigation threads.
7. Determine the previous stopping point.
8. Check approved source locations / continue prior leads.
9. Detect genuine changes (new information, not restatement of what's known).
10. Preserve new source material where practical.
11. Generate document hashes where applicable.
12. Prevent duplicate evidence.
13. Create the next evidence entry(ies), if any genuinely new fact was found.
14. Update chronology, threads, contradictions, and open questions as warranted.
15. Save investigation state.
16. Stop.

Nothing else occurs. A pass does not redesign the investigation, does not silently
change scope, and does not delete or rewrite prior entries.

## 7. No Change Detected

When a pass finds no relevant source changes, it must **not manufacture evidence** to
appear productive. Instead it records, honestly:

- date of execution;
- sources checked;
- result: **"No relevant change detected."**

The investigation state otherwise remains unchanged. A string of honest
"no relevant change" outcomes is a legitimate, expected result once a specific
question or source is genuinely exhausted — it is not a failure to be papered over,
and it is strictly preferable to inventing a finding, softening a null result into a
vague restatement of already-known facts, or silently re-registering stale content as
if it were new (see §26 on evidence confidence, and the discipline against
AI-summary conflation described in Appendix A).

## 8. Evidence Register

The Evidence Register is the investigation's primary factual record. Every evidence
item contains, at minimum:

| Field | Purpose |
|---|---|
| Evidence identifier | Permanent, unique, never reused |
| Case identifier | Which investigation this belongs to |
| Recording date | When it was added to the register |
| Source date | When the underlying fact/document originated |
| Source authority | Who published or authored it |
| Source title | Title of the source document/page |
| Source type | See §25 |
| Source location | URL or file reference |
| Preserved file reference | Path to a locally preserved copy, if any |
| Document hash | SHA-256 (or equivalent) of the preserved file, if any |
| Evidence description | What this evidence establishes |
| Relevant quotation | Direct quote, where useful/required |
| Investigation relevance | Why this matters to the case |
| Classification | See §26 |
| Verification state | See §26 |
| Relationships | Links to other evidence |
| Chronology links | Links to chronology entries this supports |
| Contradiction links | Links to contradictions this bears on |
| Open-question links | Links to open questions this bears on |

Evidence numbering is permanent. Evidence identifiers are never reused, even if an
entry is later found to be wrong — a wrong entry is corrected by a new entry that
says so, not by deletion or renumbering.

## 9. Source Register

Every source the investigation has checked — whether or not it yielded evidence —
receives a permanent record: authority, title, type, URL/file location, first
checked date, last checked date, current version description, preservation status,
hash status, associated investigation thread, and availability notes (e.g., blocked,
paywalled, since removed). This lets a future pass know what has already been tried,
including sources that turned out to be irrelevant or inaccessible, without
re-discovering that from scratch.

## 10. Chronology

The chronology records the factual progression of events the investigation concerns.
Confirmed events remain distinguished from pending/unconfirmed ones. Every chronology
entry references its supporting evidence. Later evidence may refine an entry — add
detail, correct a date — but never erase the earlier record; the correction is
itself logged. Any date arrived at by inference (rather than stated directly by a
source) must be explicitly flagged as inferred, not presented as a directly-sourced
fact.

## 11. Contradiction Register

Contradictions between sources are tracked as independent, first-class records, not
buried in narrative. Each contains: identifier, description, supporting evidence,
opposing evidence, current status, material significance (why it matters), required
resolution (what evidence would resolve it), and resolution evidence (once
available). Status values: `Open`, `Partially Resolved`, `Resolved`,
`Unable to Resolve`. A contradiction is not resolved by picking the more plausible
side — it is resolved only when evidence actually resolves it, or explicitly marked
unresolvable with reasoning.

## 12. Open Question Register

Unresolved questions are recorded permanently, not left implicit. Each records: why
the question exists, the evidence that created it, the evidence that would resolve
it, and the likely source capable of resolving it. Questions remain open until
genuinely supported by evidence — not until a plausible-sounding but unverified
answer accumulates enough repetition to feel settled (see Appendix A).

## 13. Investigation Threads

An investigation is divided into independent threads — the distinct lines of inquiry
that make up the whole case (e.g., for a factual/regulatory investigation:
historical background, a specific mechanism of harm, funding, a remediation
project's construction/commissioning/completion, current status). The exact thread
set is defined per-case at setup; it is not fixed by this specification. Each thread
records: status, supporting evidence, outstanding work, dependencies (on other
threads), and completion state.

## 14. Visual Workspace

The repository should present as a forensic workspace, not a folder of raw JSON.
At minimum it should provide navigable views for: Case Overview, Evidence Register,
Chronology, Source Register, Contradiction Register, Open Questions, Investigation
Threads, a Relationship Map (see §31, and `scripts/generate-relationship-map.js` for
a reference implementation), Preserved Sources, Automation History, Search History,
and Investigation Notes. Every view must reference the underlying evidence — no view
should present a claim without a path back to its source.

## 15. Mobile Design

The investigation workspace must remain usable on a phone: no horizontal scrolling,
no oversized tables, readable typography, stacked layouts, expandable records, fast
navigation. An investigator should be able to resume comfortably from mobile.

## 16. Validation

The repository enforces structural validation, checked before every commit (and
ideally in CI — see `.github/workflows/validate.yml` for a reference
implementation). At minimum, validation must enforce:

- Accepted evidence cannot possess zero proof-of-fact.
- Evidence identifiers remain unique.
- Case identifiers remain valid.
- Required fields cannot be empty.
- Chronology entries reference valid evidence.
- Contradictions reference actually-conflicting evidence.
- Closed questions reference genuinely resolving evidence.
- Evidence marked as accepted/verified with a preserved document possesses a document
  hash unless an explicit, recorded exception applies.

## 17. Security

Private investigation records must never be described as private while actually
publicly accessible. Public outputs remain separate from working investigation
records where the two diverge. Verification status must always remain visible next
to the claim it qualifies — never implied, never hidden behind a confident-sounding
sentence. No interface may imply evidence certainty beyond its recorded
classification. Public-facing pages never link directly to the repository itself
(source browsing, commit history, or raw specification/data files) — the published
site is a complete, self-contained presentation layer, not a pointer into the
working repository behind it. Where a public page needs to summarize repository
content (e.g. this specification), it presents that content directly rather than
sending the reader off-site to read it.

## 18. Repository Structure

A MAYHEM repository consists of: Case Definition, Evidence Register, Source
Register, Chronology, Contradictions, Open Questions, Investigation Threads,
Preserved Sources, Automation Log, Search Log, Decision Register, Change Log, Visual
Workspace, Validation Rules, and a documented Collection Workflow. Non-MAYHEM
components (e.g. legacy general-purpose tooling a repository was adapted from) must
be archived and inactive, not left runnable alongside the investigation.

## 19. Resumption Protocol

This is MAYHEM's defining feature. When reconnecting to the investigation — a new
session, a new contributor, after any gap — the protocol is:

1. Open the repository.
2. Load the investigation (case definition).
3. Display latest evidence.
4. Display chronology.
5. Display unresolved questions.
6. Display contradictions.
7. Display active threads.
8. Display the latest automation/pass result.
9. Continue collecting evidence.

No reconstruction. No document rebuilding. No searching for previous work. Everything
resumes exactly where the investigation previously stopped, because the repository's
own state *is* the memory — nothing relies on a human or an AI agent's own memory of
prior sessions.

## 20. Future Investigations

A repository may host further investigations over its lifetime, but new
investigations are never automatically created. Every future investigation receives
its own unique case identifier and fully independent evidence register, chronology,
contradiction register, thread structure, and automation state. Cases remain
completely isolated from one another (see §34).

## 21. Implementation Order

A reference order for standing up a new MAYHEM-compliant investigation:

1. Define the case (identity, objective, scope).
2. Implement validation rules.
3. Implement stable, permanent evidence/source identity (ID schemes that never
   change or get reused).
4. Implement document hashing for preserved sources.
5. Build (or adapt) the forensic workspace.
6. Implement the resumption protocol.
7. Validate the complete workflow end-to-end before beginning substantive collection.

## 22. Acceptance Criteria

A MAYHEM implementation is complete when: the repository opens directly into the
active investigation; evidence remains intact across sessions; no unrelated
investigations are silently created; automation only services the active case;
evidence numbering continues correctly; chronology, contradictions, questions, and
threads all remain persistent; the investigation resumes correctly from its previous
stopping point; and the repository itself functions as the permanent operational
record of the investigation — not a description of one kept elsewhere.

## 23. Operational Statement

The purpose of MAYHEM is to preserve factual continuity, eliminate investigation
restart costs, maintain permanent evidence integrity, and provide a structured
environment for continuing forensic investigation over time, under direct operator
control.

## 24. Case Identity

Every investigation possesses immutable identifiers, set at creation and never
changed for the life of the investigation: Case Identifier, Case Title, Investigation
Type, Jurisdiction, Geographic Scope, Commencement Date, Current Status,
Investigator, Repository Version, and Specification Version (which spec version, and
which revision of it, the investigation is operating under).

## 25. Source Classification

Every source is classified before evidence is extracted from it. Representative
categories: Legislation, Regulation, Government Record, Council Record, Policy,
Strategy, Planning Instrument, Court Decision, Scientific Publication, Academic
Literature, Media Report, Public Statement, Community Submission, Mapping, Satellite
Imagery, Photograph, Video, Audio, Inspection Record, Correspondence, Other Public
Record. A case may add categories relevant to its own domain. Classification enables
filtering and audit — it is not decoration.

## 26. Evidence Confidence

Every evidence item records its evidentiary basis. Confidence relates only to
**preservation quality and sourcing strength** — never to whether a conclusion is
true. Representative values: `Original Available`, `Complete`, `Partial`, `Archived`,
`Secondary Reference`, `Requires Verification`. A fact that is plausible but only
available via an unfetched search-engine summary is recorded at a lower confidence
tier than the same fact confirmed against an actually preserved primary document —
even if both describe the same underlying reality. See Appendix A for the specific
failure modes this tiering exists to guard against.

## 27. Search Reproducibility

Every search performed during evidence collection is logged: search terms, search
engine, database (if applicable), date, time, filters, jurisdiction, results
reviewed, results preserved. A future investigator — human or AI — must be able to
repeat an identical search and see what changed, rather than having to guess what
was already tried.

## 28. Version Control

The specification itself is versioned: version number, revision date, revision
summary, compatibility statement, and superseded versions. Historical specification
versions remain preserved (never deleted) so a case's own "which spec version was I
operating under" record (§24) stays meaningful indefinitely.

## 29. Decision Register

Operational and methodological decisions — as distinct from factual evidence about
the investigation's subject matter — are recorded separately, in their own register.
Each decision records: Decision ID, date, reason, supporting evidence (if any), the
investigator/author, and impact (what changes going forward). This is what lets an
investigation accumulate working rules over time (e.g., "how do we treat AI-extracted
document text," "what do we do when a suggested tool doesn't fit this repo") without
those rules being re-litigated from scratch every session.

## 30. Change Log

Every structural change to the repository — not just evidence additions — is logged:
date, author, files affected, reason, and whether validation was completed. No
structural change occurs without documentation. This is the audit trail for the
repository's own evolution, distinct from the Decision Register's audit trail for
investigative judgment calls.

## 31. Terminology

A MAYHEM specification should carry a canonical glossary defining its core terms at
minimum: Evidence, Source, Finding, Contradiction, Relationship, Thread, Saturation
(the point at which further searching on a question stops yielding anything new),
Validation, Preservation, Case, Archive, Reopening. This ensures consistent
interpretation across contributors and across time.

## 32. Implementation Independence

This architecture is independent of implementation technology. Equivalent
implementations may use static websites, progressive web apps, native or desktop
applications, databases, or document repositories. Compliance depends on preserving
the *operational behaviour* described in this specification, not on any particular
software choice. (The reference implementation this specification was extracted from
uses flat JSON registers validated by a small Node.js script and rendered by a static
site — see `docs/DATA_MODEL.md` and `scripts/validate.js` for one concrete example,
not a requirement.)

## 33. Failure Recovery

If interrupted at any point, the investigation resumes from the last validated
state. Recovery verifies the Evidence Register, Source Register, Chronology,
relationships, validation status, and Open Questions. No recovery step relies on
memory — human or AI — of what happened before the interruption; everything needed
is in the repository itself.

## 34. Scalability

The architecture supports single investigations, multiple concurrent investigations
(each isolated per §20), multi-jurisdiction repositories, cross-referenced cases, and
long-running investigations spanning years. Each investigation remains logically
isolated regardless of how many others share the same repository.

## 35. Architectural Constraints

A MAYHEM-compliant system shall **never**:

- alter preserved evidence;
- reuse evidence identifiers;
- delete audit history;
- merge unrelated investigations;
- hide validation failures;
- modify chronology without recording the change.

These constraints are invariant — they are not subject to case-by-case exception.

## 36. Canonical Completeness

This specification is intended to function as the complete architectural definition
of a MAYHEM investigation engine. A compliant implementation shall be constructible
from this specification alone, without reliance on undocumented procedures, hidden
operational rules, or external implementation knowledge. It defines: investigation
lifecycle, data structures, validation, preservation, audit, reporting, recovery,
governance, operational constraints, repository behaviour, and case management.

Future revisions may extend this specification but shall preserve backward
compatibility unless an explicit breaking revision is declared (§28).

---

## Appendix A — Failure modes this specification exists to prevent

These are not formal requirements beyond what's already stated above, but they name
the specific, recurring failure modes that motivated several of the rules above, so
implementers understand *why* the rules exist rather than treating them as arbitrary
process:

- **Manufactured evidence under pressure to look productive.** An automated pass
  that always finds *something* to add will eventually pad the register with
  restatements or weak inferences. §7 exists specifically to make "nothing new found"
  a legitimate, expected, and honestly-logged outcome.
- **AI-summary conflation.** Search-engine or LLM-generated summaries can misdate old
  content, or blend two distinct source documents into one confident-sounding claim
  that neither document actually supports. Before registering a striking new finding
  sourced only from an AI-generated summary, check it against independently
  reproducible detail (a direct quote search, a publication-date check, a second
  distinct source) — and if it doesn't hold up, log the rejection and the reasoning,
  don't just silently drop it (future passes benefit from knowing it was checked).
- **Provenance drift.** Evidence extracted by an AI from a document (e.g., PDF-to-text
  extraction) carries a materially different confidence than a human's direct read of
  the same document, and this must be reflected in classification/verification state
  — not silently treated as equivalent.
- **Untrustworthy hashes.** A `document_hash` value must always be the literal output
  of a hashing tool run against the actual preserved file — never estimated, recalled,
  or typed from memory. A hash that was never actually computed against the real file
  is worse than no hash, because it creates false confidence in integrity that was
  never verified.
- **Silent workaround of access controls.** If a source is blocked (paywall, bot
  detection, robots.txt, an explicit organizational access policy), that is a
  recorded access gap — not a problem to be engineered around. Route through the
  access constraint dishonestly and the resulting evidence's provenance becomes
  unreliable in a way validation can't catch after the fact.
- **Scope creep disguised as thoroughness.** Finding something interesting adjacent
  to the investigation's actual scope is not, by itself, a reason to register it as
  evidence of this case. §4's Controlled Scope principle exists so that "this is
  interesting" and "this is relevant to what we were asked to investigate" stay
  distinct judgments.
- **Framing drift after a correction.** A language-discipline fix made in one
  document (e.g., rewriting a remedy-demand document that had drifted into
  complaint-lodging language) does not automatically propagate to every other place
  the same document or stage is described. A case's own meta description, a
  front-page summary sentence, or another case's copy of the same template can
  silently keep the old framing after the document itself has been fixed. A fix to
  *the* document is not a fix to *every mention of* the document — sweep for the
  same phrase everywhere it could recur, not only where it was first found.
- **Analysis re-litigating what an earlier stage already settled.** A downstream
  stage that treats a fact as newly discovered without first checking whether an
  earlier stage's own record already resolved it (e.g. re-opening a naming variant
  as an unresolved discrepancy when the source register already noted it as a plain
  scribal artifact) doesn't just waste effort — it can quietly overstate uncertainty
  the record doesn't actually have. Read the full existing record for the stage
  being built on, not only the specific file that stage is nominally about.
