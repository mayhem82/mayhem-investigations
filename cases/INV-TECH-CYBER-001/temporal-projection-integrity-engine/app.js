(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const el = (tag, text, cls) => {const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
  const add = (parent,tag,text,cls) => {const n=el(tag,text,cls);parent.appendChild(n);return n;};
  const link=(label,href)=>{const a=el('a',label);a.href=href;return a;};
  async function digest(bytes){if(!globalThis.crypto?.subtle)return null;return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');}
  async function main(){
    const urls=['assessments.json','../lattice-atlas/patterns.json','../dfapta/analysis.json','../data/evidence_register.json'];
    const responses=await Promise.all(urls.map(url=>fetch(url,{cache:'no-store'})));if(responses.some(r=>!r.ok))throw Error('An assessment or source record could not be loaded.');
    const [gate,atlasBytes,analysisBytes,evidenceBytes]=await Promise.all([responses[0].json(),...responses.slice(1).map(r=>r.arrayBuffer())]);
    if(!Array.isArray(gate.assessments))throw Error('Unexpected assessment format.');
    const hashes=await Promise.all([atlasBytes,analysisBytes,evidenceBytes].map(digest));
    const expected=[gate.basis.atlas_sha256,gate.basis.analysis_sha256,gate.basis.evidence_sha256];
    const labels=['Lattice Atlas','DFAPTA analysis','evidence register'];
    const changed=labels.filter((_,i)=>hashes[i]&&hashes[i]!==expected[i]);
    let message=changed.length ? `Source records changed since this reading: ${changed.join(', ')}. Earlier assessments remain visible and need review against the changes.` : hashes.some(h=>!h) ? 'The assessments loaded, but this browser could not check all source hashes.' : 'The current source records match those used for this reading.';
    byId('state').textContent=message+' Reading recorded '+gate.created_at_utc+'.';
    byId('count').textContent=gate.assessments.length+' assessed assertions';
    const cards=gate.assessments.map(item=>{
      const card=el('article',undefined,'path');card.id=item.id;add(card,'div',item.id,'path-id');add(card,'h3',item.title);
      add(card,'h4','Forward assertion under review');add(card,'p',item.candidate);
      add(card,'h4','What the current record says');add(card,'p',item.known);
      add(card,'h4','Gate assessment: classification 4');add(card,'p',item.classification_4);
      add(card,'h4','Gate assessment: classification 1');add(card,'p',item.classification_1);
      add(card,'h4','Gate assessment: classification 2');add(card,'p',item.classification_2);
      add(card,'h4',item.determination);add(card,'p',item.determination_reason);
      add(card,'h4','What this means in practice');add(card,'p',item.practical_implication);
      add(card,'h4','Evidence that would revise this decision');add(card,'p',item.would_revise);
      const refs=el('div',undefined,'anchors');refs.setAttribute('aria-label','Supporting Atlas, analysis and evidence references');refs.appendChild(link(item.atlas,'../lattice-atlas/#'+encodeURIComponent(item.atlas)));item.analysis_paths.forEach(id=>refs.appendChild(link(id,'../dfapta/#'+encodeURIComponent(id))));item.evidence.forEach(id=>refs.appendChild(link(id,'../dfapti/#evidence/'+encodeURIComponent(id))));card.appendChild(refs);byId('assessment-list').appendChild(card);return {card,text:JSON.stringify(item).toLocaleLowerCase()};
    });
    byId('search').addEventListener('input',event=>{const value=event.target.value.trim().toLocaleLowerCase();cards.forEach(x=>{x.card.hidden=!!value&&!x.text.includes(value);});});
    const scroll=()=>{let id;try{id=decodeURIComponent(window.location.hash.slice(1));}catch{return;}if(!/^TPA-\d+$/.test(id))return;const dest=byId(id);if(dest){if(dest.hidden){byId('search').value='';cards.forEach(x=>{x.card.hidden=false;});}dest.scrollIntoView();}};
    window.addEventListener('hashchange',scroll);scroll();
  }
  main().catch(error=>{byId('state').textContent=`Assessments unavailable: ${error.message} Please reload or consult the Atlas.`;});
})();
