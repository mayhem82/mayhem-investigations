'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { CASES, ROOT } = require('./case-registry');
const { validateCase } = require('./validate');

function collect() {
  return CASES.map(validateCase);
}
function compare(current, baseline) {
  const remaining = new Map();
  for (const row of baseline.cases) for (const error of row.errors) {
    const key = row.caseId + '\n' + error;
    remaining.set(key, (remaining.get(key) || 0) + 1);
  }
  const added = [];
  for (const row of current) for (const error of row.errors) {
    const key = row.caseId + '\n' + error;
    if (remaining.get(key)) remaining.set(key, remaining.get(key) - 1);
    else added.push({caseId:row.caseId, error});
  }
  return added;
}

if (require.main === module) {
  const cases = collect();
  const totalErrors = cases.reduce((sum,c) => sum + c.errors.length, 0);
  const revision = cp.execFileSync('git', ['rev-parse','HEAD'], {cwd:ROOT,encoding:'utf8'}).trim();
  const workingTreeChanges = cp.spawnSync('git', ['diff','--quiet','HEAD'], {cwd:ROOT}).status !== 0;
  const report = {generatedAt:new Date().toISOString(), revision, workingTreeChanges, status:totalErrors ? 'FAILED' : 'PASSED', totalErrors, cases};
  const dir=path.join(ROOT,'audit');
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(dir,'validation.txt'),cases.map(c=>c.caseId+' — '+c.errors.length+' errors\n'+c.errors.map(e=>'  - '+e).join('\n')).join('\n\n')+'\n');
  console.log(`Strict validation: ${report.status}; ${totalErrors} errors. Full results saved to audit/.`);
  if (process.argv.includes('--gate')) {
    const baseline=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/audits/known-validation-failures.json'),'utf8'));
    const added=compare(cases,baseline);
    if(added.length){console.error(JSON.stringify(added,null,2)); process.exitCode=1;}
    else console.log('Publication regression gate: no additional validation errors. Existing failures remain FAILED and are published in full.');
  }
}
module.exports={compare,collect};
