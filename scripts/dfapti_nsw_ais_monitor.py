"""DFAPTI NSW AIS: bounded primary-source capture, SHA-256 and append-only audit.
No automatic promotion of assertions into the Evidence Register.
"""
import datetime as dt
import hashlib
import json
import pathlib
import urllib.request
import urllib.error
import urllib.parse
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]
CASE = ROOT / "cases/DFAPTI-NSW-AIS-2026-00001"
DATA = CASE / "data"
ARCHIVE = CASE / "source-archive"
LIMIT = 2_000_000
now = dt.datetime.now(dt.timezone.utc)
stamp = now.strftime("%Y%m%dT%H%M%SZ")

def read(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))

def write(name, value):
    (DATA / name).write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

sources = read("source_register.json")
logs = read("automation_log.json")
results = []
ARCHIVE.mkdir(parents=True, exist_ok=True)
for source in sources:
    url = source["url_or_file_location"]
    result = {"source_id": source["source_id"], "url": url}
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MAYHEM-DFAPTI-source-capture/1.0", "Accept": "text/html,application/pdf,text/plain"})
        if urllib.parse.urlparse(url).scheme != "https":
            raise ValueError("Only HTTPS source URLs are permitted")
        for attempt in range(3):
            try:
                response = urllib.request.urlopen(req, timeout=20)
                break
            except (urllib.error.URLError, TimeoutError) as transient:
                if attempt == 2:
                    raise
                time.sleep(attempt + 1)
        with response:
            result["http_status"] = response.status
            result["final_url"] = response.geturl()
            result["content_type"] = response.headers.get("Content-Type", "")
            content = response.read(LIMIT + 1)
            result["response_bytes"] = len(content)
        if len(content) > LIMIT:
            result["capture_status"] = "Oversize: not archived; no partial preservation"
        elif not content:
            result["capture_status"] = "Empty response; not archived"
        elif content.lstrip().lower().startswith((b"<!doctype html", b"<html")) and any(
            marker in content[:5000].lower()
            for marker in (b"captcha", b"verify you are human", b"access denied", b"cloudflare challenge")
        ):
            result["capture_status"] = "Challenge or access-denied page; not preserved as source"
        else:
            digest = hashlib.sha256(content).hexdigest()
            extension = ".pdf" if content.startswith(b"%PDF-") else ".html" if b"html" in result["content_type"].lower() else ".bin"
            folder = ARCHIVE / source["source_id"]
            folder.mkdir(parents=True, exist_ok=True)
            filename = digest + extension
            destination = folder / filename
            if not destination.exists():
                destination.write_bytes(content)
            result.update({"capture_status": "Preserved", "sha256": digest, "preserved_file_reference": str(destination.relative_to(ROOT)), "bytes": len(content)})
            source["preservation_status"] = "Preserved"
            source["hash_status"] = "SHA-256: " + digest
            source["last_checked"] = now.date().isoformat()
            source["availability_notes"] = "Captured response: " + str(destination.relative_to(ROOT)) + "; source contents and applicability still require review."
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as exc:
        result["check_error"] = type(exc).__name__ + ": " + str(exc)[:240]
    results.append(result)
logs.append({
    "run_id": "RUN-" + str(len(logs) + 1).zfill(4),
    "date": now.isoformat(timespec="seconds"),
    "sources_checked": [s["source_id"] for s in sources],
    "result": "Primary-source capture attempted; no evidence assertions promoted.",
    "evidence_added": [],
    "notes": "Source bytes and SHA-256 captured where accessible and within size limit. Archived responses may be redirects, errors or challenge pages: manual content validation required. Existing evidence remains provisional.",
    "checks": results,
})
write("source_register.json", sources)
write("automation_log.json", logs)
