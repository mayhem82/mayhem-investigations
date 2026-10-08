# MAYHEM Government Record Agent v0.1

Experimental collection agent. It is deliberately outside every case evidence register.

## Authority boundary
The agent may discover, fetch, hash, preserve and map public government records and produce candidate evidence. It MUST NOT:
- add or accept EV-* evidence;
- create or expand a case;
- close a thread or question;
- freeze evidence;
- unlock DFAPTA or later stages;
- infer intent, motive, breach, negligence or illegality.

Human Authority in SPEC.md remains controlling.

## Run
GitHub Actions -> "MAYHEM Government Record Agent" -> Run workflow.
Inputs: existing CASE-ID, seed government URL, allowed government hosts, document limit.

Each run emits an immutable downloadable artifact containing run.json, documents.json, links.json and preserved source files. Nothing is written to canonical case data.

## v0.1 acceptance test
Seed the Bellbrook flying-fox council record. The run passes only if it follows the connected public-government documentary chain without leaving approved hosts or contaminating accepted evidence.
