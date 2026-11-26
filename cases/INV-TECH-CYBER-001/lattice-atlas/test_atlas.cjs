const fs = require('node:fs');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {webcrypto} = require('node:crypto');
const {TextDecoder} = require('node:util');
const here = __dirname;
const atlas = JSON.parse(fs.readFileSync(path.join(here, 'patterns.json')));
const bytes = cp.execFileSync('git', ['show', 'HEAD:cases/INV-TECH-CYBER-001/dfapta/analysis.json'], {cwd: here});
const analysis = JSON.parse(bytes);
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), atlas.analysis_sha256);
const paths = new Map(analysis.paths.map(x => [x.id, x]));
assert.equal(new Set(atlas.patterns.map(p => p.id)).size, atlas.patterns.length);
for (const pattern of atlas.patterns) {
  assert.ok(pattern.finding && pattern.boundary && pattern.connections.length >= 2);
  for (const c of pattern.connections) {
    assert.ok(paths.has(c.path), c.path);
    assert.deepEqual(c.evidence, paths.get(c.path).anchors, c.path);
  }
}
assert.throws(() => cp.execFileSync('node', [path.join(here, 'create_initial.cjs')], {stdio:'pipe'}), /Command failed/);
class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.textContent = ''; this.hidden = false; }
  appendChild(child) { this.children.push(child); return child; }
  setAttribute() {}
  addEventListener(type, fn) { this[type] = fn; }
}
const elements = new Map();
const document = {createElement: tag => new Element(tag), getElementById: id => {if (!elements.has(id)) elements.set(id,new Element('div')); return elements.get(id);}};
let analysisBytes = bytes;
const fetch = async url => url === 'patterns.json'
  ? {ok:true,json:async()=>atlas}
  : {ok:true,arrayBuffer:async()=>analysisBytes.buffer.slice(analysisBytes.byteOffset, analysisBytes.byteOffset+analysisBytes.byteLength)};
const context = {document,fetch,TextDecoder,crypto:webcrypto}; context.globalThis=context;
vm.runInNewContext(fs.readFileSync(path.join(here,'app.js'),'utf8'), context);
setTimeout(() => {
  assert.match(elements.get('state').textContent, /matches the reading/);
  assert.equal(elements.get('pattern-list').children.length, atlas.patterns.length);
  elements.get('search').input({target:{value:'EV-0052'}});
  assert.ok(elements.get('pattern-list').children.some(c=>c.hidden));
  assert.ok(elements.get('pattern-list').children.some(c=>!c.hidden));
  const changed = {...analysis, paths: analysis.paths.filter(x => x.id !== atlas.patterns[0].connections[0].path)};
  analysisBytes = Buffer.from(JSON.stringify(changed));
  elements.clear();
  vm.runInNewContext(fs.readFileSync(path.join(here,'app.js'),'utf8'), context);
  setTimeout(() => {
    assert.match(elements.get('state').textContent, /has changed since/);
    assert.match(elements.get('state').textContent, /missing referenced paths/);
    console.log('Atlas references, hash and change notice, overwrite guard, rendering and search passed.');
  }, 100);
},100);
