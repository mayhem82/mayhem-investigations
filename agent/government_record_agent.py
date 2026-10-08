#!/usr/bin/env python3
import argparse, hashlib, json, os, re, time
from urllib.error import HTTPError
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse, urldefrag
from urllib.request import Request, urlopen
from io import BytesIO
try:
    from pypdf import PdfReader
except ImportError:
    PdfReader=None

UA="MAYHEM-Government-Record-Agent/0.1 (+public-record research)"
GLOSSARY_URL="https://mayhem82.github.io/mayhem-investigations/glossary/index.html"

def load_glossary():
    try:
        req=Request(GLOSSARY_URL,headers={"User-Agent":UA})
        with urlopen(req,timeout=25) as r: raw=r.read(5_000_000)
        html=raw.decode("utf-8","replace")
        glossary_sha=hashlib.sha256(raw).hexdigest()
        p=Links(); p.feed(html); lines=p.text
        statuses={"CURRENT","LEGACY","EXTERNAL","UNRESOLVED","AMBIGUOUS","OTHER"}
        entries={}
        for i,s in enumerate(lines):
            parts=s.rsplit(" ",1)
            if len(parts)==2 and parts[1] in statuses and len(parts[0])<120:
                term=parts[0].strip()
                entries.setdefault(term,{"term":term,"status":parts[1],"source":GLOSSARY_URL})
        return entries,None,raw,glossary_sha
    except Exception as e:
        return {},str(e)[:500],None,None
class Links(HTMLParser):
    def __init__(self): super().__init__(); self.links=[]; self.text=[]
    def handle_starttag(self,tag,attrs):
        if tag=="a":
            h=dict(attrs).get("href")
            if h:self.links.append(h)
    def handle_data(self,data):
        s=" ".join(data.split())
        if s:self.text.append(s)

def norm(u):
    u=urldefrag(u)[0]
    p=urlparse(u)
    return u if p.scheme in ("http","https") else ""

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--case",required=True); ap.add_argument("--seed",required=True)
    ap.add_argument("--hosts",required=True); ap.add_argument("--max-docs",type=int,default=40)
    ap.add_argument("--out",default="agent-output")
    ap.add_argument("--resume",default=None,help="Prior agent-output directory to resume from")
    a=ap.parse_args()
    hosts={h.strip().lower() for h in a.hosts.split(",") if h.strip()}
    seed=norm(a.seed); sh=urlparse(seed).hostname.lower()
    if sh not in hosts: raise SystemExit("Seed host must be explicitly allowed")
    os.makedirs(os.path.join(a.out,"preserved"),exist_ok=True)
    glossary,glossary_error,glossary_raw,glossary_sha=load_glossary()
    glossary_preserved_file=None
    if glossary_raw is not None:
        glossary_preserved_file=f"preserved/master-glossary-{glossary_sha[:16]}.html"
        open(os.path.join(a.out,glossary_preserved_file),"wb").write(glossary_raw)
    q=[seed]; seen=set(); docs=[]; edges=[]; errors=[]; leads=[]; known_hashes=set(); resumed_from=None
    if a.resume:
        prior_docs=os.path.join(a.resume,"documents.json")
        prior_leads=os.path.join(a.resume,"leads.json")
        if os.path.exists(prior_docs):
            try:
                old=json.load(open(prior_docs))
                known_hashes={x.get("sha256") for x in old if x.get("sha256")}
                resumed_from=a.resume
            except Exception as e: errors.append({"resume":a.resume,"error":"Prior documents unreadable: "+str(e)[:400]})
        if os.path.exists(prior_leads):
            try:
                old_leads=json.load(open(prior_leads))
                leads.extend(x for x in old_leads if x.get("status")=="UNRESOLVED_LEAD")
            except Exception as e: errors.append({"resume":a.resume,"error":"Prior leads unreadable: "+str(e)[:400]})
    glossary_gate_open=bool(glossary) and not glossary_error
    if glossary_error: errors.append({"url":GLOSSARY_URL,"error":"Glossary gate unavailable: "+glossary_error})
    while q and len(docs)<a.max_docs:
        u=q.pop(0)
        if u in seen: continue
        seen.add(u); host=(urlparse(u).hostname or "").lower()
        if host not in hosts: continue
        try:
            req=Request(u,headers={"User-Agent":UA})
            with urlopen(req,timeout=25) as r:
                body=r.read(20_000_000); final=norm(r.geturl()); ct=r.headers.get("Content-Type","").split(";")[0].lower()
            sha=hashlib.sha256(body).hexdigest()
            ext=".pdf" if ("pdf" in ct or final.lower().endswith(".pdf")) else ".html"
            duplicate_of_prior=sha in known_hashes
            fn=f"{len(docs)+1:04d}-{sha[:16]}{ext}"
            open(os.path.join(a.out,"preserved",fn),"wb").write(body)
            rec={"document_id":f"DOC-{len(docs)+1:04d}","url":u,"final_url":final,"content_type":ct,"sha256":sha,"bytes":len(body),"preserved_file":f"preserved/{fn}","duplicate_of_prior_run":duplicate_of_prior}
            docs.append(rec)
            if ext==".pdf" and PdfReader:
                try:
                    reader=PdfReader(BytesIO(body))
                    pdftext="\n".join((pg.extract_text() or "") for pg in reader.pages)
                    rec["extracted_text_chars"]=len(pdftext)
                    patterns=[
                        ("file_number",r"File Number\s+([A-Z]\d{2}/\d+(?:/\d+)?)"),
                        ("resolution",r"\b(20\d{2}\.\d{1,3})\b"),
                        ("future_meeting",r"report(?: results)? back by the ([A-Za-z]+) ordinary council meeting"),
                        ("management_plan",r"([A-Z][A-Za-z ]{2,60}Management Plan)"),
                        ("statutory_reference",r"((?:section|clause)\s+\d+(?:\.\d+)?[^\n.]{0,100})"),
                    ]
                    weights={"future_meeting":5,"management_plan":4,"resolution":4,"statutory_reference":2,"file_number":1}
                    if not glossary_gate_open:
                        rec["terminology_gate"]="GLOSSARY_GATE_BLOCKED"
                    for kind,pat in (patterns if glossary_gate_open else []):
                        for m in re.finditer(pat,pdftext,re.I):
                            val=(m.group(1) if m.groups() else m.group(0)).strip()
                            start=max(0,m.start()-220); end=min(len(pdftext),m.end()+220)
                            context=" ".join(pdftext[start:end].split())
                            score=weights[kind]
                            if re.search(r"Bellbrook|Flying[- ]?Fox",context,re.I): score+=3
                            glossary_match=glossary.get(val)
                            glossary_state=(glossary_match or {}).get("status","NOT_FOUND")
                            query=f'site:{urlparse(final).hostname} "{val}"'
                            if re.search(r"Bellbrook|Flying[- ]?Fox",context,re.I):
                                query += ' Bellbrook "flying fox"'
                            item={"from":final,"kind":kind,"value":val,"specificity_score":score,"context":context[:500],"glossary_resolution":glossary_state,"glossary_source":GLOSSARY_URL if glossary_match else None,"suggested_search_query":query,"status":"UNRESOLVED_LEAD"}
                            if not any(x["kind"]==kind and x["value"]==val and x["from"]==final for x in leads):
                                leads.append(item)
                    for raw in re.findall(r"https?://[^\s<>()]+",pdftext):
                        v=norm(raw.rstrip(".,;:"))
                        vh=(urlparse(v).hostname or "").lower()
                        if v and vh in hosts:
                            edges.append({"from":final,"to":v,"discovered_in":"pdf_text"})
                            if v not in seen and v not in q:q.append(v)
                except Exception as e:
                    errors.append({"url":u,"error":"PDF parse: "+str(e)[:450]})
            if ext==".html":
                text=body.decode("utf-8","replace"); p=Links(); p.feed(text)
                rec["title_text"]=next((x for x in p.text if len(x)>8),"")[:300]
                for href in p.links:
                    v=norm(urljoin(final,href))
                    if not v: continue
                    vh=(urlparse(v).hostname or "").lower()
                    if vh in hosts:
                        edges.append({"from":final,"to":v})
                        if v not in seen and v not in q:q.append(v)
        except HTTPError as e:
            if e.code == 403:
                errors.append({"url":u,"error":"HTTP 403: direct runner retrieval blocked","classification":"ACCESS_CHANNEL_BLOCK"})
                if not any(x.get("from")==u and x.get("kind")=="retrieval_required" for x in leads):
                    leads.append({"from":u,"kind":"retrieval_required","value":"Official source blocked to GitHub runner","specificity_score":10,"context":"Direct acquisition returned HTTP 403. Preserve as unresolved acquisition lead; do not treat as missing evidence.","glossary_resolution":"NOT_APPLICABLE","glossary_source":None,"suggested_search_query":f'site:{urlparse(u).hostname} Bellbrook "flying fox" council meeting',"status":"UNRESOLVED_LEAD"})
            else:
                errors.append({"url":u,"error":str(e)[:500]})
        except Exception as e:
            errors.append({"url":u,"error":str(e)[:500]})
        time.sleep(.2)
    json.dump(docs,open(os.path.join(a.out,"documents.json"),"w"),indent=2)
    json.dump(edges,open(os.path.join(a.out,"links.json"),"w"),indent=2)
    leads.sort(key=lambda x:(-x.get("specificity_score",0),x["kind"],x["value"]))
    json.dump(leads,open(os.path.join(a.out,"leads.json"),"w"),indent=2)
    run={"agent":"MAYHEM Government Record Agent","version":"0.1","case_id":a.case,"seed":seed,"allowed_hosts":sorted(hosts),"glossary_gate":{"source":GLOSSARY_URL,"entries_loaded":len(glossary),"error":glossary_error,"state":"OPEN" if glossary_gate_open else "BLOCKED","sha256":glossary_sha,"preserved_file":glossary_preserved_file},"documents_preserved":len(docs),"links_recorded":len(edges),"documentary_leads":len(leads),"errors":errors,"resume_state":{"resumed_from":resumed_from,"prior_hashes_loaded":len(known_hashes),"unresolved_leads_carried":sum(1 for x in leads if x.get("status")=="UNRESOLVED_LEAD")},"authority_state":"CANDIDATE COLLECTION ONLY - NO EVIDENCE ACCEPTED"}
    frontier={"case_id":a.case,"unresolved_leads":[x for x in leads if x.get("status")=="UNRESOLVED_LEAD"],"seen_urls":sorted(seen),"known_hashes":sorted(known_hashes|{x["sha256"] for x in docs})}
    json.dump(frontier,open(os.path.join(a.out,"frontier.json"),"w"),indent=2)
    json.dump(run,open(os.path.join(a.out,"run.json"),"w"),indent=2)
    print(json.dumps(run,indent=2))
if __name__=="__main__": main()
