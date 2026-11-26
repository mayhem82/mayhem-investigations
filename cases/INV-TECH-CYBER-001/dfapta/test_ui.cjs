// Exercise rendering and the changed-register warning without network access.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {webcrypto} = require('node:crypto');
const {TextDecoder} = require('node:util');
const here = __dirname;
const stage = JSON.parse(fs.readFileSync(path.join(here, 'analysis.json')));
const evidence = JSON.parse(fs.readFileSync(path.join(here, '../data/evidence_register.json')));
evidence.push({evidence_id: 'EV-9999', source_title: 'New fixture record', evidence_description: 'Unreviewed fixture'});
const body = Buffer.from(JSON.stringify(evidence));
class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.textContent = ''; this.hidden = false; }
  appendChild(child) { this.children.push(child); return child; }
  append(text) { this.children.push({textContent: text, children: []}); }
  setAttribute() {}
  addEventListener(type, callback) { this[type] = callback; }
}
const targets = new Map();
const document = {
  createElement: tag => new Element(tag),
  getElementById: id => { if (!targets.has(id)) targets.set(id, new Element('div')); return targets.get(id); }
};
const fetch = async url => url === 'analysis.json'
  ? {ok: true, json: async () => stage}
  : {ok: true, arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength)};
const context = {document, fetch, URL, TextDecoder, crypto: webcrypto};
context.globalThis = context;
vm.runInNewContext(fs.readFileSync(path.join(here, 'app.js'), 'utf8'), context);
setTimeout(() => {
  assert.match(targets.get('state').textContent, /register bytes differ/);
  assert.equal(targets.get('paths-list').children.length, stage.paths.length);
  assert.equal(targets.get('cross-path-list').children.length, stage.cross_path_observations.length);
  const coverage = targets.get('coverage-list').children;
  assert.ok(coverage.some(item => item.children.some(child => child.textContent.includes('EV-9999'))));
  const firstCard = targets.get('paths-list').children[0];
  assert.equal(firstCard.children.filter(child => child.textContent.includes(stage.paths[0].analysis)).length, 1);
  assert.ok(firstCard.children.some(child => child.textContent === 'Mechanism'));
  const search = targets.get('path-search');
  search.input({target: {value: 'EV-0052'}});
  assert.ok(targets.get('paths-list').children.some(card => card.hidden));
  assert.ok(targets.get('paths-list').children.some(card => !card.hidden));
  console.log('UI rendering, changed-register notice, new evidence, and search: passed');
}, 100);
