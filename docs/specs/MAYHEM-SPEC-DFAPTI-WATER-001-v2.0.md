---
case_identifier: "DFAPTI-BB-2026-00001"
spec_version: "MAYHEM-SPEC-DFAPTI-WATER-001-v2.0"
status: "Operational Architecture Specification"
primary_case: "DFAPTI-BB-2026-00001"
title: "Willawarrin / Bellbrook Recurring Drinking Water Failure"
date: "2026-07-25"
author: "mayhem82"
---

> This is the case-specific operational specification for
> `DFAPTI-BB-2026-00001`. For the general, case-agnostic MAYHEM
> specification that anyone can reuse to start a new investigation, see
> [`/SPEC.md`](../../SPEC.md) at the repository root.

MAYHEM

Modular Audit and Yield for Humans Enforcement Mechanism

DFAPTI WATER INVESTIGATION WORKFLOW SPECIFICATION

Specification: MAYHEM-SPEC-DFAPTI-WATER-001-v2.0

Status: Operational Architecture Specification

Primary Case: DFAPTI-BB-2026-00001

Title: Willawarrin / Bellbrook Recurring Drinking Water Failure

---

1. PURPOSE

This specification upgrades the existing Council Intelligence repository into a dedicated DFAPTI investigation engine.

The repository is no longer intended to function as a general council-monitoring platform, target discovery engine, or public intelligence dashboard.

Its sole operational purpose is to maintain a persistent forensic investigation into the Willawarrin and Bellbrook drinking-water issue while preserving every stage of evidence collection.

The repository becomes the investigation itself.

Separate investigation documents should no longer be required for active work because the repository permanently stores investigative state.

---

2. INVESTIGATION OBJECTIVE

The investigation exists to establish a complete, source-verified chronology of the recurring drinking-water failures affecting Willawarrin and Bellbrook.

This includes:

• Trucked-water events

• Water-quality failures

• Iron and manganese contamination

• Low-flow river conditions

• Operational decisions

• Funding approvals

• Design decisions

• Construction history

• Commissioning

• Operational delays

• Permanent treatment solution

• Current operating status

Every conclusion must remain supported by preserved primary-source evidence.

---

3. ARCHITECTURAL CHANGE

The previous repository architecture supported multiple investigations.

That architecture is now retired.

The upgraded architecture supports one operational DFAPTI investigation.

Everything revolves around one persistent case.

Current operational case:

DFAPTI-BB-2026-00001

Willawarrin / Bellbrook Recurring Drinking Water Failure

Future investigations remain possible but are not automatically created.

---

4. DESIGN PRINCIPLES

The upgraded machinery operates under the following permanent principles.

Single Case

Only one investigation is active.

Persistent Investigation

The investigation never resets.

Append-Only Evidence

Evidence is never overwritten.

Evidence is never renumbered.

Evidence is never silently modified.

Corrections become new evidence.

Source Before Analysis

Primary source material is preserved before analytical interpretation.

Controlled Scope

The investigation never expands itself beyond operator-defined scope.

Human Authority

Only the operator determines:

• Investigation scope

• Case creation

• Evidence acceptance

• Thread closure

• Investigation completion

---

5. REMOVED CAPABILITIES

The following machinery is removed from active operation.

General council intelligence collection.

Automatic council scanning.

Automatic target generation.

Mass investigation creation.

Heat-score dashboards.

Matter ranking.

Public allegation systems.

Automatic keyword investigations.

General council monitoring.

None of these systems remain active during routine operation.

---

6. PERMITTED AUTOMATION

Automation exists only to continue the current investigation.

Every execution performs the following sequence.

Load the investigation.

Load all evidence.

Load chronology.

Load contradictions.

Load unresolved questions.

Load investigation threads.

Determine the previous stopping point.

Check approved source locations.

Detect genuine changes.

Preserve new source material.

Generate document hashes where applicable.

Prevent duplicate evidence.

Create the next evidence entry.

Update chronology.

Update investigation threads.

Update contradictions.

Update unresolved questions.

Save investigation state.

Stop.

Nothing else occurs.

---

7. NO CHANGE DETECTED

When no relevant source changes are found the automation must not manufacture evidence.

Instead it records:

Date of execution.

Sources checked.

Result.

“No relevant change detected.”

The investigation state remains unchanged.

---

8. EVIDENCE REGISTER

The Evidence Register is the primary factual record.

Every evidence item contains:

Evidence identifier

Case identifier

Recording date

Source date

Source authority

Source title

Source type

Source location

Preserved file reference

Document hash

Evidence description

Relevant quotation where required

Investigation relevance

Classification

Verification state

Relationships

Chronology links

Contradiction links

Open-question links

Evidence numbering is permanent.

Evidence identifiers are never reused.

---

9. SOURCE REGISTER

Every approved source receives a permanent record.

Each source stores:

Authority

Title

Type

URL or file location

First checked

Last checked

Current version

Preservation status

Hash status

Associated investigation thread

Availability notes

---

10. CHRONOLOGY

The chronology records the factual progression of events.

Confirmed events remain distinguished from pending events.

Every chronology entry references supporting evidence.

Later evidence may refine chronology but never erase earlier records.

Date inference is always identified as inference.

---

11. CONTRADICTION REGISTER

Contradictions remain independent records.

Each contradiction stores:

Identifier

Description

Supporting evidence

Opposing evidence

Current status

Material significance

Required resolution

Resolution evidence

Status values include:

Open

Partially Resolved

Resolved

Unable to Resolve

---

12. OPEN QUESTION REGISTER

The investigation permanently records unresolved questions.

Each question stores:

Why the question exists.

Evidence creating the question.

Evidence required to resolve it.

Likely source capable of resolving it.

Questions remain open until supported by evidence.

---

13. INVESTIGATION THREADS

The investigation is divided into independent threads.

Initial threads include:

Historical failures.

Trucked water.

Iron contamination.

Manganese contamination.

River conditions.

Extraction decisions.

Funding.

Treatment plant.

Construction.

Commissioning.

Completion.

Current operational status.

Each thread records:

Status.

Supporting evidence.

Outstanding work.

Dependencies.

Completion state.

---

14. VISUAL WORKSPACE

The repository becomes a forensic workspace rather than a council dashboard.

The workspace contains:

Case Overview

Evidence Register

Chronology

Source Register

Contradiction Register

Open Questions

Investigation Threads

Relationship Map

Preserved Sources

Automation History

Search History

Investigation Notes

Every view references the underlying evidence.

---

15. MOBILE DESIGN

The investigation must remain usable on a phone.

No horizontal scrolling.

No oversized tables.

Readable typography.

Stacked layouts.

Expandable records.

Fast navigation.

The investigation should resume comfortably from mobile.

---

16. VALIDATION

The repository enforces structural validation.

Accepted evidence cannot possess zero proof-of-fact.

Evidence identifiers remain unique.

Case identifiers remain valid.

Required fields cannot be empty.

Chronology references valid evidence.

Contradictions reference conflicting evidence.

Closed questions reference resolving evidence.

Accepted preserved documents possess document hashes unless an approved exception exists.

---

17. SECURITY

Private investigation records must not be described as private while publicly accessible.

Public outputs remain separate from working investigation records.

Verification status must always remain visible.

No interface may imply evidence certainty beyond recorded classification.

---

18. REPOSITORY STRUCTURE

The upgraded repository consists of:

Case Definition

Evidence Register

Source Register

Chronology

Contradictions

Open Questions

Investigation Threads

Preserved Sources

Automation Log

Search Log

Visual Workspace

Validation Rules

Collection Workflow

Legacy council-monitoring components become archived and inactive.

---

19. RESUMPTION PROTOCOL

This is the defining feature of the upgraded machinery.

When reconnecting:

Open repository.

Load investigation.

Display latest evidence.

Display chronology.

Display unresolved questions.

Display contradictions.

Display active threads.

Display latest automation result.

Continue collecting evidence.

No reconstruction.

No document rebuilding.

No searching for previous work.

Everything resumes exactly where the investigation previously stopped.

---

20. FUTURE INVESTIGATIONS

Additional investigations remain possible.

However:

New investigations are never automatically created.

Every future investigation receives:

A unique case identifier.

Independent evidence register.

Independent chronology.

Independent contradiction register.

Independent thread structure.

Independent automation state.

Cases remain completely isolated.

---

21. IMPLEMENTATION ORDER

1. Preserve existing water-treatment investigation.

2. Disable council-wide machinery.

3. Restrict active repository to DFAPTI-BB-2026-00001.

4. Implement validation rules.

5. Implement stable source identity.

6. Implement document hashing.

7. Replace dashboard with forensic workspace.

8. Implement investigation resumption.

9. Validate complete workflow.

---

22. ACCEPTANCE CRITERIA

The upgraded machinery is considered complete when:

The repository opens directly into the water-treatment investigation.

Evidence remains intact.

No unrelated investigations are created.

Council-wide monitoring is inactive.

Automation only services the active case.

Evidence numbering continues correctly.

Chronology remains persistent.

Contradictions remain persistent.

Questions remain persistent.

Investigation threads remain persistent.

The investigation resumes from the previous stopping point.

The repository itself becomes the permanent operational investigation.

---

23. OPERATIONAL STATEMENT

This specification defines the upgraded DFAPTI investigation machinery for the Willawarrin / Bellbrook drinking-water investigation.

The purpose of the machinery is to preserve factual continuity, eliminate investigation restart costs, maintain permanent evidence integrity, and provide a structured visual environment for continuing forensic investigation over time.

The repository is no longer a general council intelligence system.

It is a persistent DFAPTI investigation engine operating under direct operator control.

---

24. CASE IDENTITY

Every investigation shall possess immutable identifiers.

Required fields:

Case Identifier

Case Title

Investigation Type

Jurisdiction

Geographic Scope

Commencement Date

Current Status

Investigator

Repository Version

Specification Version

These identifiers never change during the life of the investigation.

---

25. SOURCE CLASSIFICATION

Every source shall be classified before evidence extraction.

Examples include:

Legislation

Regulation

Government Record

Council Record

Policy

Strategy

Planning Instrument

Court Decision

Scientific Publication

Academic Literature

Media Report

Public Statement

Community Submission

Mapping

Satellite Imagery

Photograph

Video

Audio

Inspection Record

Correspondence

Other Public Record

Classification enables filtering and audit.

---

26. EVIDENCE CONFIDENCE

Every evidence item records its evidentiary basis.

Confidence relates only to preservation quality, not whether a conclusion is true.

Fields include:

Original available

Complete

Partial

Archived

Secondary reference

Requires verification

---

27. SEARCH REPRODUCIBILITY

Every search records:

Search terms

Search engine

Database

Date

Time

Filters

Jurisdiction

Results reviewed

Results preserved

Future investigators can repeat identical searches.

---

28. VERSION CONTROL

The specification itself maintains:

Version Number

Revision Date

Revision Summary

Compatibility Statement

Superseded Versions

Historical specifications remain preserved.

---

29. DECISION REGISTER

Operational decisions are recorded separately from evidence.

Each decision records:

Decision ID

Date

Reason

Supporting Evidence

Investigator

Impact

This provides a complete audit trail of investigative decisions.

---

30. CHANGE LOG

Repository changes record:

Date

Author

Files affected

Reason

Validation completed

No structural change occurs without documentation.

---

31. TERMINOLOGY

The specification contains a canonical glossary defining all core terms, including:

Evidence

Source

Finding

Contradiction

Relationship

Thread

Saturation

Validation

Preservation

Case

Archive

Reopening

This ensures consistent interpretation.

---

32. IMPLEMENTATION INDEPENDENCE

The architecture is independent of implementation technology.

Equivalent implementations may use:

Static websites

Progressive Web Apps

Native applications

Desktop software

Databases

Document repositories

Compliance depends on preserving operational behaviour, not on software choice.

---

33. FAILURE RECOVERY

If interrupted, the investigation resumes from the last validated state.

Recovery verifies:

Evidence Register

Source Register

Chronology

Relationships

Validation status

Open Questions

No reconstruction relies on memory.

---

34. SCALABILITY

The architecture supports:

Single investigations

Multiple concurrent investigations

Multi-jurisdiction repositories

Cross-referenced cases

Long-running investigations

Each investigation remains logically isolated.

---

35. ARCHITECTURAL CONSTRAINTS

The system shall never:

Alter preserved evidence

Reuse evidence identifiers

Delete audit history

Merge unrelated investigations

Hide validation failures

Modify chronology without recording the change

These constraints are invariant.

---

36. CANONICAL COMPLETENESS

This specification is intended to function as the complete architectural definition of the Forensic Public Sourced Investigations engine.

A compliant implementation shall be constructible from this specification alone without reliance on undocumented procedures, hidden operational rules, or external implementation knowledge.

It defines:

Investigation lifecycle

Data structures

Validation

Preservation

Audit

Reporting

Recovery

Governance

Operational constraints

Repository behaviour

Case management

Future revisions may extend the specification but shall preserve backward compatibility unless an explicit breaking revision is declared.

With these additions, the specification becomes not just a software design document, but a complete operational standard capable of governing future implementations across different repositories and platforms.
