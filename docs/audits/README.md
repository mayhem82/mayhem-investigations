# Technical audit, 24 October 2026

The audit found collection and publication defects as well as historical data inconsistencies. Code repairs do not certify the investigations' assertions.

## Preservation policy

Existing evidence, verification labels, chronology, notes and automation history remain unchanged. Some failures cannot be repaired mechanically: records lack supporting evidence, use ambiguous verification descriptions, refer to sources instead of files, or lack source metadata. These need record-level review and append-only corrections. No evidence is promoted, no supporting citations are invented, and no historical log is reconstructed.

The initial audit found 925 errors at 1905788. The updated checkout c01929b had 928 under the original validator; another scheduled run arrived at 3f23f84 during repair. Stronger preservation checks exposed 15 further problems. Three missing change registers were initialized, 15 mutable source hash-status fields were normalized to `Hashed` with the same digest retained separately, and the historical capture-only result sentence received an explicit backward-compatible enum value. No historical run text changed. The current repair report contains 870 errors and remains FAILED.

## Publication policy while historical failures are open

`node scripts/validate.js` remains strict and exits 1 on any failure. CI retains that strict check. Publishing the audit results is not a declaration that those failures are fixed.

The deployment gate runs regression tests, local-link and archive checks, and rejects any validation error beyond the explicit case-scoped inventory in `known-validation-failures.json`. It regenerates and publishes the full failed-validation report for the deployed checkout. The baseline is a list of unresolved defects, not a schema extension or a list of permitted values; it must not be expanded automatically to accommodate new failures. Removing a failure does not authorize altering evidence or erasing provenance. A fully clean strict run remains the goal.

`known-validation-failures.json` is generated once from the reviewed repair checkout. It deliberately has no automatic update mode. Source monitor changes use canonical `hash_status: Hashed`, a separate `document_hash`, and `result: Source capture attempted.` for future runs.

## Repairs implemented

1. Case-scoped collector state; mismatched case/scope resumes fail closed.
2. Pending and retry queues, cumulative visited URLs and document hashes survive resumption.
3. Oversize, empty and truncated responses are not published as complete documents.
4. Redirect destinations are checked before requests; HTTPS downgrades are refused.
5. Source identity preserves path/query case and trailing slashes.
6. Preservation validation checks actual file existence, repository containment and SHA-256. Windows checkout conversions are handled only for unchanged Git files.
7. Both broken authored links are repaired, including the catalogue generator.
8. Deployment runs checks and generates audit results. Successful collectors trigger publication through workflow completion instead of relying on token-generated pushes.

## Still open

- Historical schema reconciliation, including the duplicate NOTE-0146 and missing supporting evidence. See the full generated validation report.
- Some evidence preservation references are explanatory text, source identifiers or directories; these must be replaced through a documented correction with actual artifacts or explicit external-preservation metadata.
- The default collector's upstream 403 responses are an access limitation, not proof of absent evidence. These code fixes do not claim to resolve the external access block.
- Live network acquisition behavior is not established by the offline regression fixtures.

No past evidence or source artifact has been rewritten by this repair.
