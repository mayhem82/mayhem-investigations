'use strict';
fetch('results.json', {cache:'no-store'}).then(response=>{
  if(!response.ok)throw new Error('Report unavailable');
  return response.json();
}).then(report=>{
  document.getElementById('status-title').textContent = report.totalErrors ? 'FAILED — unresolved record issues' : 'PASSED — structural checks';
  document.getElementById('validation-summary').textContent = `${report.totalErrors} validation errors across ${report.cases.length} cases. This status is separate from the code regression tests.`;
  document.getElementById('revision').textContent = `Checked revision: ${report.revision}${report.workingTreeChanges ? ' + local changes' : ''} · Report generated: ${report.generatedAt}`;
  const container=document.getElementById('case-results');
  for(const row of report.cases){
    const details=document.createElement('details');
    const summary=document.createElement('summary');
    summary.textContent=`${row.caseId} — ${row.errors.length} errors`;
    const list=document.createElement('ul');
    for(const error of row.errors){const item=document.createElement('li');item.textContent=error;list.appendChild(item);}
    details.append(summary,list);container.appendChild(details);
  }
}).catch(()=>{
  document.getElementById('validation-summary').textContent='The current report could not be loaded. Use the full validation output below; do not interpret this as a pass.';
});
