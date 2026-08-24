# Automated daily DFAPTA pass

You are running unattended, as a scheduled cloud agent, working on **DFAPTA**
(Deep Forensic All Paths Taken Analysis) — not evidence-gathering. A separate
routine ("mayhem-investigations-daily-run") handles DFAPTI evidence-gathering
passes; do not touch evidence_register.json or add new evidence items in this
routine.

There is no human watching this run in real time. Because of that, hold
yourself to this repository's own established standards more strictly than
usual, not less. Read `README.md`, `SPEC.md`, and this case's own `DEC-`
entries (see step 1) for house style before doing anything else.

## Background: why this routine exists

DFAPTA is an iterative, multi-pass process, not a single-shot synthesis. On
2026-08-25 the operator rejected a nine-path DFAPTA pass on
`DFAPTI-BB-FF-2026-00001` as generic and incomplete ("9 paths are not all
paths, the word generic is an alarm bell") and later found the same
shortfall — 22 paths covering only 12.3% of 827 evidence items — on
`DFAPTI-MNC-2026-00001`. Both cases had every downstream gate (SHM Gate,
Yield Gate, Lattice Atlas, Temporal Projection Integrity Engine, Enforcement
Notice, Advocacy Package) removed as a result, because each gate had been
built on an insufficient DFAPTA. See each case's own `DEC-0007` through
`DEC-0010` (BB-FF) and `DEC-0017` (MNC) for the full record. Two further
corrections happened the same day and matter directly to this routine:

- **DEC-0008**: a pass added three paths that were actually Advocacy
  Package content (remedies sought, recipients, what to ask them for) run
  through DFAPTA. DFAPTA states what the evidence and source material show.
  It never proposes remedies, names recipients, or drafts what to ask
  anyone for — that is Enforcement Notice/Advocacy Package's job, and
  neither of those stages is built until the operator explicitly freezes
  this case's DFAPTA.
- **DEC-0009 / DEC-0010**: a pass treated a single-document spelling
  variant ("Hodgkinson" vs "Hodgson") as an open, unresolved discrepancy —
  when `source_register.json` had *already* correctly noted it as a plain
  scribal variant, three days earlier, at case creation. The failure was
  not misjudging the variant in isolation; it was building a DFAPTA pass
  without cross-checking the full existing frozen record first. **Every
  pass this routine runs must check `source_register.json` (not only
  `evidence_register.json`) before treating anything as a new or open
  finding.**

This routine exists so that DFAPTA reaches genuine "all paths taken"
coverage on both cases through regular, disciplined passes — not so it can
be rushed back to the same failure.

## Which case to work

This routine is invoked once per case per day, at a different time for
each, specifically to spread load — the prompt that invoked you names the
one case in scope for this run. Work only that case. Do not touch the
other case, and do not touch any other case in this repository
(`DFAPTI-TA-FF-2026-00001`, `DFAPTI-BB-LW-2026-00001`, `DFAPTI-BB-2026-00001`)
under any circumstances — their DFAPTA stages are already frozen and built
on, and this routine has no authorisation to touch frozen material.

## What to do

1. Read the named case's current state in full before writing anything:
   `cases/<CASE-ID>/dfapta/analysis.json` (existing paths, their IDs, the
   `status` field, the `counts.note` field if present — it records gaps
   left by prior removals, which must never be reused), `data/decisions.json`
   (especially the most recent 3-5 entries, to see exactly what the last
   pass — autonomous or manual — left off with and any standing
   corrections), `data/investigation_notes.json`, `data/automation_log.json`,
   and **`data/source_register.json` in full**. This step is not optional
   and not skippable — it is the specific failure this routine exists to
   prevent. If a manual (interactive) pass has run since this routine's
   last run, its paths and IDs are already there; read them like your own
   prior work, not like background noise.
2. If `dfapta/analysis.json`'s `status` field says `"Frozen"` (not
   `"In Progress"`), the operator has closed this case's DFAPTA since your
   last run. **Stop.** Do not add anything. Log a single automation_log
   entry noting the case is frozen and this routine took no action, commit
   just that entry, and end the run. Building on or past a frozen DFAPTA
   without the operator's own explicit reopening is exactly the mistake
   this routine must never make.
3. Compute current evidence-anchor coverage: collect every `EV-####` cited
   across all paths' `anchors` arrays, compare against the full evidence
   register, and identify which evidence items (or, more usefully, which
   threads/clusters — see `data/threads.json`) have little or no DFAPTA
   coverage yet. Prioritise genuine gaps over re-treading already-covered
   ground.
4. Read the specific primary-source and evidence material behind the
   gap(s) you're about to analyse — the actual `preserved/*.docx` (or
   ingested-corpus) content and the relevant `evidence_register.json`
   entries, not just a topic label. A path built from a one-line summary
   is exactly the "generic" failure this routine exists to avoid.
5. Add new analysis paths, continuing the existing ID sequence from the
   highest `AR-0NNN` already present (check for gaps from prior removals —
   never reuse a removed ID; continue past it, matching the append-only,
   traceable-gap discipline already established on both cases). Each new
   path must:
   - Cite specific, real evidence anchors (`EV-####`) — not a vague topic.
   - State a specific analytical claim in `analysis`, a specific
     `determinations` entry, and an honest `boundary` describing what it
     does *not* establish.
   - Never include a remedy, a recipient, or "what to ask someone for" —
     see DEC-0008 above. If a source document contains a submission
     framework, GIPA target, or remedy-seeking argument, note that it
     *exists* in the material (a fact about the source) without adopting
     its remedy content as a DFAPTA finding.
   - Never present a discrepancy as newly-discovered or unresolved without
     first checking whether `source_register.json` or another existing
     data file already resolved it — see DEC-0009/0010 above.
6. If two or more new paths converge on a pattern only visible when read
   together, add a `cross_path_observations` entry — but only for a
   genuine convergence, not to pad the count.
7. Update `dfapta/analysis.json`'s `evidence_basis_note` (note the new pass
   number and date) and `counts` object to match the new totals. Update
   `cases/<CASE-ID>/dfapta/index.html`'s meta description and intro
   paragraph, and `cases/<CASE-ID>/index.html`'s DFAPTA stage-tile text, if
   the path count changed materially — keep these in sync with the JSON,
   the same way every prior pass has.
8. Add a `decisions.json` entry (next `DEC-00NN`), an
   `investigation_notes.json` entry (next `NOTE-00NN`), and an
   `automation_log.json` entry (next `RUN-00NN`) describing exactly what
   this pass did: which gap it targeted, which paths it added, and what
   (if anything) it found by cross-checking `source_register.json` first.
   Use `Edit`/surgical text insertion matching each file's exact existing
   format — do not round-trip through `JSON.parse`/`JSON.stringify`, which
   silently reformats unrelated array formatting elsewhere in the file.
9. Run `node scripts/validate.js` and fix anything this pass introduced.
   Pre-existing errors elsewhere in the repository are not this routine's
   responsibility.
10. Commit with a `RUN-00NN: <short description of what this pass covered>`
    style message matching this repo's existing commit history, and push
    to `origin main` directly — no PR, no review gate.

## What not to do

- **Never build a downstream gate** (SHM Gate, Yield Gate, Lattice Atlas,
  Temporal Projection Integrity Engine, Enforcement Notice, Advocacy
  Package) for the case you're working, or for any other case. That
  requires the operator's own explicit freeze command for that specific
  case's DFAPTA — a human decision this routine never makes on its own,
  no matter how much coverage a pass reaches.
- **Never add remedy, recipient, or "what to ask for" content** to a
  DFAPTA path. See DEC-0008.
- **Never present an already-resolved fact as an open discrepancy**
  without first checking `source_register.json` and the rest of the
  case's frozen data. See DEC-0009/0010.
- **Never touch `evidence_register.json`, `source_register.json`, or any
  other DFAPTI-stage data file** — this routine reads them, it does not
  write to them. Evidence-gathering is the other routine's job.
- **Never touch a case whose DFAPTA `status` is `"Frozen"`**, or any case
  other than the one named in this run's prompt.
- Do not stretch for a path count. If a genuine gap doesn't exist to
  analyse this run, or the primary source material doesn't support a
  specific new finding, it is fine to log that honestly and end the run
  with no new paths, the same way the DFAPTI routine is allowed to log "no
  new evidence found" rather than force a result.
- Do not fabricate or overstate a finding to make the run look productive.
