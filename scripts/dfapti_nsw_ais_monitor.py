"""Isolated, append-only DFAPTI source availability monitor. No evidence promotion."""
import datetime as dt
import json
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / "cases/DFAPTI-NSW-AIS-2026-00001/data"
sources = json.loads((DATA / "source_register.json").read_text())
logfile = DATA / "automation_log.json"
logs = json.loads(logfile.read_text())
now = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
results = []
for source in sources:
    url = source["url_or_file_location"]
    result = {"source_id": source["source_id"], "url": url}
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "MAYHEM-DFAPTI-source-monitor/1.0"})
        with urllib.request.urlopen(request, timeout=15) as response:
            result["http_status"] = response.status
            result["final_url"] = response.geturl()
            result["content_type"] = response.headers.get("Content-Type", "")
    except Exception as exc:
        result["check_error"] = type(exc).__name__ + ": " + str(exc)[:240]
    results.append(result)
logs.append({
    "run_id": "RUN-" + str(len(logs) + 1).zfill(4),
    "date": now,
    "sources_checked": [s["source_id"] for s in sources],
    "result": "Source availability checked; no evidence added or verified.",
    "evidence_added": [],
    "notes": "Automated HEAD/GET source accessibility observations only; results do not establish document contents, authenticity, currency or legal applicability.",
    "checks": results,
})
logfile.write_text(json.dumps(logs, indent=2, ensure_ascii=False) + "\n")
