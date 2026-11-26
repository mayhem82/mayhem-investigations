// Initial dated reading. Refuse to replace a prior atlas; append new records or
// dated corrections instead. Data are derived from the cited analysis paths.
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const output = path.join(__dirname, 'patterns.json');
if (fs.existsSync(output)) throw new Error('Atlas exists: preserve it and append changes instead.');
// Hash the Git blob rather than a Windows CRLF-converted working-tree file.
const bytes = require('node:child_process').execFileSync('git', ['show', 'HEAD:cases/INV-TECH-CYBER-001/dfapta/analysis.json'], {cwd: __dirname});
const analysis = JSON.parse(bytes);
const paths = new Map(analysis.paths.map(p => [p.id, p]));
const patterns = [
  {
    id: 'LAT-001', title: 'Recovery has several clocks',
    finding: 'The end of a technical disruption, the return of a service and the completion of people’s disrupted tasks are different milestones. The evidence describes these layers in several independent settings.',
    connections: [
      ['AR-003', 'CrowdStrike reported that it reverted the update before later reporting a percentage of Windows sensors back online.'],
      ['AR-006', 'A recovery percentage does not answer whether a stranded traveller got home or received reimbursement.'],
      ['AR-023', 'Hamilton described upstream recovery, its own restart and the subsequent processing of queued submissions.'],
      ['AR-031', 'Cloudflare reported separate Replicate prediction incidents and differing stages of recovery for affected models.'],
      ['AR-032', 'Anthropic reported a connector impact end and a later resolved status as distinct milestones.']
    ],
    boundary: 'These are comparisons of documented milestones, not proof that the incidents shared a cause or that a particular person remained harmed. Each source’s scope and attribution still matter.'
  },
  {
    id: 'LAT-002', title: 'The fallback becomes another dependency',
    finding: 'Workarounds can move the task to another route, organisation or person. The records also show why an alternative service’s history matters without assuming it failed at the moment it was offered.',
    connections: [
      ['AR-012', 'Healthcare organisations described phone-based alternatives alongside different local recovery and backlog arrangements.'],
      ['AR-018', 'A department identified a separate cargo lodgement route as an alternative for some documents affected by the messaging disruption.'],
      ['AR-020', 'That cargo route had a separately documented earlier interruption.'],
      ['AR-022', 'A later cargo notice advised users to retry, followed by a reported restoration.'],
      ['AR-036', 'Hamilton advised phone or Facebook routes when its reporting channel was unavailable.']
    ],
    boundary: 'The earlier cargo interruption does not prove the alternative was unavailable when offered on 13 November. The notices do not establish how many people used a workaround, whether they could access it, or their outcomes.'
  },
  {
    id: 'LAT-003', title: 'Shared software links need their own evidence',
    finding: 'A provider can identify an upstream dependency, but a similar name or overlapping time does not supply a missing attribution. The strength of each link differs.',
    connections: [
      ['AR-032', 'Anthropic attributed connector effects to Microsoft in its own account; that account does not independently prove the underlying cause.'],
      ['AR-033', 'An OpenAI connector notice overlaps in time but does not attribute that incident to the same cause.'],
      ['AR-034', 'OpenAI attributed some Codex failures to a GitHub disruption but did not identify the particular GitHub incident.'],
      ['AR-026', 'A GitHub Copilot incident named an upstream provider without identifying it; another record cannot supply that identity.']
    ],
    boundary: 'This is not a map of every vendor dependency, nor proof of a shared incident, compromise or complete downstream recovery. These links retain their separate source and attribution.'
  },
  {
    id: 'LAT-004', title: 'Outage-themed deception recurs in distinct reports',
    finding: 'Public reports describe people being targeted with messages themed around service outages. Their samples and measures are different, so their counts must remain separate.',
    connections: [
      ['AR-007', 'A 2024 outage prompted warnings about impersonation and reports of defensive takedowns.'],
      ['AR-027', 'Shared indicators connect later published descriptions, but do not prove independent samples or a common operator.'],
      ['AR-028', 'Separate security-control reports may differ because of samples, configurations or timing; they do not establish that the outage disabled controls.'],
      ['AR-029', 'One vendor’s ratios and another researcher’s bounded message count are different measures.'],
      ['AR-035', 'Trellix’s 252-message total comprises four time-bounded waves, with a later change in message framing.']
    ],
    boundary: 'These reports do not establish a worldwide total, unique victims, a named common actor, a successful compromise or the cause of an outage. No malicious destination is contacted or published here.'
  },
  {
    id: 'LAT-005', title: 'Changed words and changing numbers change the story',
    finding: 'A present-day page is not necessarily the wording first published, and a count must retain its unit. Flattening either distinction can erase a change in the public record.',
    connections: [
      ['AR-001', 'The published Optus account revised unsuccessful-call figures; a separate regulator count measured people, not calls.'],
      ['AR-025', 'Two copies of a GitHub explanation repeat one provider account; later edits mean the present wording cannot be dated to the original update.'],
      ['AR-037', 'An Essex capture contains body timestamps and later page-modification metadata together; neither recovers missing prior text.'],
      ['AR-029', 'A telemetry ratio and a message count measure different quantities; the underlying samples may overlap and cannot be combined into a global total.']
    ],
    boundary: 'The underlying call logs and earlier source versions are not in these records. Repeated wording is not automatically independent corroboration, and absent wording is not reconstructed.'
  },
  {
    id: 'LAT-006', title: 'A service can be partly available and still fail a critical task',
    finding: 'Service presence and service usefulness are different observations. The record distinguishes a visible network from an emergency call, and core emergency continuity from disruption to other work.',
    connections: [
      ['AR-002', 'The Optus review describes radios remaining visible while some emergency calls could not connect and describes a fallback constraint.'],
      ['AR-011', 'Reports of continuing core emergency functions coexist with reported disruption to other work in separate healthcare records.'],
      ['AR-001', 'Counts of unsuccessful calls and people unable to access emergency calling measure different things.']
    ],
    boundary: 'These are separate records, not a claim of one technical cause. They do not establish every call, patient experience or individual outcome, or that a proposed fix was completed.'
  },
  {
    id: 'LAT-007', title: 'Recurring incidents are not one undifferentiated outage',
    finding: 'Repeated interruptions can be visible in the public record even when their causes and their users’ outcomes remain unknown. Retaining separate events keeps both recurrence and uncertainty visible.',
    connections: [
      ['AR-030', 'Cloudflare reported a further Replicate registry restriction after an earlier reported resolution.'],
      ['AR-031', 'Cloudflare described several distinct Replicate prediction events and recovery stages.'],
      ['AR-021', 'A 15 November cargo notice and restoration are separate reported milestones.'],
      ['AR-022', 'A 23 November cargo notice separately advised retrying and later reported restoration.']
    ],
    boundary: 'Recurrence does not prove the first fix failed, a single cause, any connection between cargo and Replicate, or that every delayed task succeeded after restoration.'
  }
];
for (const pattern of patterns) {
  pattern.connections = pattern.connections.map(([id, observation]) => {
    const p = paths.get(id);
    if (!p) throw new Error(`Unknown analysis path: ${id}`);
    return { path: id, observation, evidence: p.anchors };
  });
}
const result = {
  atlas_id: 'LATTICE-INV-TECH-CYBER-001', status: 'Live and continuing',
  created_at_utc: new Date().toISOString(),
  analysis_sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  evidence_basis: analysis.basis,
  note: 'This identifies the analysis read for this initial atlas. It is traceability, not a freeze. Add later patterns and dated corrections while preserving earlier records.',
  patterns
};
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n', {flag:'wx'});
