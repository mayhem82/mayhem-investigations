# Preserved Sources - DFAPTI-MNC-2026-00001

This directory holds the external ChatGPT Deep Research corpus this case
was ingested from (see `data/decisions.json` DEC-0001 and DEC-0002, and
`data/automation_log.json` RUN-0001) - plain-text extractions of the 16
unique `.docx` files the case operator supplied, conducted 2026-08-14 to
2026-08-16, referenced by evidence items EV-0034 and EV-0035.

## Provenance and honesty note

These are **not** primary sources this investigation independently fetched
or verified - they are a separate AI system's research output, converted
from `.docx` to plain text (with hyperlink targets recovered from the
underlying OOXML relationships, since a naive tag-strip loses citation
URLs entirely). Every claim in them should be treated as a lead requiring
independent confirmation, not as an established fact, per DEC-0001. The
Evidence Register's own `evidence_description` and `investigation_relevance`
fields, not these files, are this case's actual register - these files are
the underlying source material a future run can promote further items
from.

## Files

- `snapshot-01-2026-08-14.txt` through `snapshot-12-2026-08-16.txt` -
  all twelve numbered Deep Research Snapshots (an unnumbered first
  snapshot plus Snapshots 2-12). Snapshot 7 (findings F-131-F-140, the
  policy-feedback/technology-ratchet branch) was supplied later than the
  rest, on 2026-08-17, closing the gap noted at
  `data/investigation_notes.json` NOTE-0008 - see NOTE-0009 onward and
  RUN-0002.
- `continuing-investigation-question-bank-v1_0.txt` - the 763-question
  bank (sections A-AC) this case's Open Question Register was curated
  from.
- `answer-register-a-to-k-run001.txt` / `answer-register-l-to-t-run001.txt`
  - RUN 001's classification of 519 of those questions as
  RESOLVED / PARTIAL / OPEN - PRIMARY RECORD / OPEN - ANALYTICAL.
- `gipa-primary-record-acquisition-pack-v1_0.txt` - the six segmented
  GIPA-ready applications drafted against NSW Police InfoLink (EV-0034).
- `ae-primary-record-acquisition-register-run001.txt` - per-question
  public-record acquisition status and next-route register for Section AE.

## Convention

Unlike `EV-####`-per-file preservation elsewhere in this repository, these
files are a single corpus preserved as a set (this case had no live
per-source collection process of its own yet). Once added, a file here is
never edited or replaced in place - a corrected or updated copy is a new
file. Individual document hashes were not computed for this ingestion pass
(see EV-0034/EV-0035's `hash_exception_reason`).
