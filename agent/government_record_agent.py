#!/usr/bin/env python3
import argparse, hashlib, json, os, re, time
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse, urldefrag
from urllib.request import Request, urlopen

UA="MAYHEM-Government-Record-Agent/0.1 (+public-record research)"
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
    a=ap.parse_args()
    hosts={h.strip().lower() for h in a.hosts.split(",") if h.strip()}
    seed=norm(a.seed); sh=urlparse(seed).hostname.lower()
    if sh not in hosts: raise SystemExit("Seed host must be explicitly allowed")
    os.makedirs(os.path.join(a.out,"preserved"),exist_ok=True)
    q=[seed]; seen=set(); docs=[]; edges=[]; errors=[]
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
            fn=f"{len(docs)+1:04d}-{sha[:16]}{ext}"
            open(os.path.join(a.out,"preserved",fn),"wb").write(body)
            rec={"document_id":f"DOC-{len(docs)+1:04d}","url":u,"final_url":final,"content_type":ct,"sha256":sha,"bytes":len(body),"preserved_file":f"preserved/{fn}"}
            docs.append(rec)
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
        except Exception as e:
            errors.append({"url":u,"error":str(e)[:500]})
        time.sleep(.2)
    json.dump(docs,open(os.path.join(a.out,"documents.json"),"w"),indent=2)
    json.dump(edges,open(os.path.join(a.out,"links.json"),"w"),indent=2)
    run={"agent":"MAYHEM Government Record Agent","version":"0.1","case_id":a.case,"seed":seed,"allowed_hosts":sorted(hosts),"documents_preserved":len(docs),"links_recorded":len(edges),"errors":errors,"authority_state":"CANDIDATE COLLECTION ONLY - NO EVIDENCE ACCEPTED"}
    json.dump(run,open(os.path.join(a.out,"run.json"),"w"),indent=2)
    print(json.dumps(run,indent=2))
if __name__=="__main__": main()
