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

Each run emits an immutable downloadable artifact containing run.json, documents.json, links.json, leads.json and preserved source files. Nothing is written to canonical case data.

## v0.1 acceptance test
Seed the Bellbrook flying-fox council record. The run passes only if it follows the connected public-government documentary chain without leaving approved hosts or contaminating accepted evidence.


## Documentary leads
PDF text is also mined for auditable next-search leads such as council file numbers, resolution numbers, promised future meeting/report dates, named management plans and statutory references. These are leads only; they are never promoted to evidence automatically.


## Master Glossary gate
Before interpreting an extracted KSC term, code or identifier, the agent consults the published KSC Master Glossary. Existing CURRENT, LEGACY, EXTERNAL, UNRESOLVED and AMBIGUOUS classifications are inherited rather than reinvented. A glossary miss does not authorize an expansion. Context-sensitive interpretation remains required for AMBIGUOUS terms. The glossary is a terminology-control input, not evidence of the underlying case fact.


### Fail-closed behaviour
If the Master Glossary cannot be loaded, the run records the glossary gate as BLOCKED. Government source retrieval and preservation may continue, but terminology extraction, interpretation and terminology-derived search-lead generation are disabled for that run. This prevents a temporary glossary failure from silently bypassing MAYHEM terminology control.
