const test = require('node:test');
const assert = require('node:assert/strict');
const { compare } = require('../scripts/audit-report');
const baseline={cases:[{caseId:'A',errors:['existing']}]};
test('publication gate rejects new errors and duplicate occurrences',()=>{
  assert.equal(compare([{caseId:'A',errors:['existing']}],baseline).length,0);
  assert.equal(compare([{caseId:'A',errors:[]}],baseline).length,0);
  assert.equal(compare([{caseId:'A',errors:['existing','new']}],baseline).length,1);
  assert.equal(compare([{caseId:'A',errors:['existing','existing']}],baseline).length,1);
  assert.equal(compare([{caseId:'B',errors:['existing']}],baseline).length,1);
});
