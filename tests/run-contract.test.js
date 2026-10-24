const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { validateRun, digest } = require('../scripts/run-contract');
const { validateCase } = require('../scripts/validate');
const { findCase } = require('../scripts/case-registry');
const valid={stage:'DFAPTA',result:'Analysis paths added.',evidence_added:[],analysis_paths_added:['AR-075']};
test('analysis contract rejects evidence additions, unknown paths, prose and inconsistent outcomes',()=>{
 const ids=new Set(['AR-075']);
 assert.deepEqual(validateRun(valid,ids),[]);
 for(const bad of [{evidence_added:['EV-0010']},{analysis_paths_added:['AR-999']},{result:'DFAPTA Pass 40 completed - 1 new path added.'},{result:'No analysis paths added.'},{analysis_paths_added:['AR-075','AR-075']},{stage:'invented'}]) assert.ok(validateRun({...valid,...bad},ids).length);
 assert.deepEqual(validateRun({...valid,result:'Analysis frozen; no action taken.',analysis_paths_added:[]},ids),[]);
});
test('original RUN-0144 preserved and correction hash-bound; other historical errors remain visible',()=>{
 const info=findCase('DFAPTI-BB-FF-2026-00001');
 const original=JSON.parse(fs.readFileSync(info.dataDir+'/automation_log.json')).find(r=>r.run_id==='RUN-0144');
 const correction=JSON.parse(fs.readFileSync(info.dataDir+'/automation_corrections.json'))[0];
 assert.equal(original.result,'DFAPTA Pass 40 completed - 1 new path added.');
 assert.equal(digest(original),correction.original_sha256);
 assert.notEqual(digest({...original,notes:'changed'}),correction.original_sha256);
 const result=validateCase(info);
 assert.ok(!result.errors.some(e=>e.includes('[RUN-0144]')));
 assert.ok(result.errors.some(e=>e.includes('invalid result')));
});
