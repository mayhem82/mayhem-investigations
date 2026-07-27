# Preserved Sources

This directory holds locally preserved copies of source material (PDFs,
page snapshots, images, screenshots, audio/video) referenced by
`preserved_file_reference` in `data/evidence_register.json`.

## Convention

- Filename: `<evidence_id>-<short-slug>.<ext>`, e.g.
  `EV-0001-council-minutes-july-2026.pdf`.
- Evidence records reference the file by its path relative to the
  repository root: `preserved/EV-0001-council-minutes-july-2026.pdf`.
- Once added, a file here is never edited or replaced in place. A
  corrected or updated copy of the same material is saved as a new file
  and referenced by a new evidence record - never overwritten.
- After adding a file, compute its hash with
  `node scripts/hash-file.js preserved/<filename>` and record the result
  in the evidence item's `document_hash` field.

This directory is currently empty: no evidence has been collected yet.
