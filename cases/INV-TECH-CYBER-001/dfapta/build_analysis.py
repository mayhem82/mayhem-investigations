"""Create the initial live DFAPTA record from the present case evidence.

This creates a dated analysis checkpoint, not an evidence freeze. Updating the
analysis requires a new explicit pass and retained history, not rerunning this
script over an existing record. No network access or evidence writes occur.
"""
import collections
import datetime
import hashlib
import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[3]
DATA = pathlib.Path(__file__).resolve().parent.parent / 'data'
OUT = pathlib.Path(__file__).resolve().parent / 'analysis.json'
if OUT.exists():
    raise SystemExit('An analysis already exists; refusing to overwrite it.')

def load(name):
    return json.loads((DATA / (name + '.json')).read_text(encoding='utf-8'))

evidence = load('evidence_register')
sources = load('source_register')
chronology = load('chronology')
by_id = {x['evidence_id']: x for x in evidence}
paths = []

def path(title, anchors, reported, analysis, boundary):
    for anchor in anchors:
        if anchor not in by_id:
            raise ValueError('Missing evidence ' + anchor)
    paths.append({'id': f'AR-{len(paths)+1:03}', 'title': title,
                  'anchors': anchors, 'source_record': reported,
                  'analysis': analysis, 'boundary': boundary})

path('Emergency call correction: calls and people are different measures', ['EV-0003','EV-0004'],
     'The minister reported an Optus revision from 229 unsuccessful mobile calls to at least 2,697. The regulator separately reported 2,145 people without emergency-call access and 369 missed welfare checks.',
     'The later call count changes the published account substantially. The regulator’s people count and the minister’s call count are different units; neither can be subtracted from the other to identify individual outcomes.',
     'The underlying call logs, counting definitions and individual outcomes are not in these records. Verification covers the attributed publications, not every underlying event.')
path('Emergency fallback: a radio can remain present when calls fail', ['EV-0003','EV-0007'],
     'The review describes radios continuing to transmit when some calls could not reach Triple Zero, and limits on remotely making those radios stop so devices could seek another network.',
     'A device may still see a network while the emergency calling path is unavailable. The apparent presence of radio service and the practical availability of an emergency call are separate conditions.',
     'The review is an account of this incident, not proof the described fallback failed in every call or that subsequent proposed work was completed.')
path('CrowdStrike: update interval and recovery interval', ['EV-0005','EV-0013','EV-0009'],
     'CrowdStrike attributed Windows crashes to its update, reporting deployment at 04:09 and reversion at 05:27 UTC on 19 July. A signed filing repeats those times; later testimony reported around 99 percent of Windows sensors online by 29 July.',
     'Stopping or reverting the update and restoring affected systems are distinct milestones. A later sensor-online percentage has a different scope from the restoration of every dependent service.',
     'The timeline and mechanism remain operator-supplied accounts; independent deployment telemetry and every customer outcome are not established.')
path('Search silence is bounded by the search performed', ['EV-0010','EV-0013'],
     'A search of one hearing transcript did not locate several precise deployment-time strings. A separately preserved signed filing gave deployment and reversion times.',
     'The absence of a term in one searched edition is not evidence that the deployment time was unknowable or absent from every record.',
     'The filing and account share the operator as source; this is not independent deployment telemetry.')
path('Device estimates and source-specific time bases', ['EV-0006','EV-0014','EV-0013'],
     'Microsoft estimated 8.5 million affected Windows devices and gave 18 July without a time zone. Google Cloud reported some customer Windows virtual machines crashing from 04:09 UTC and no direct impact to its own cloud services; the filing gives 19 July in UTC.',
     'The records describe different populations and time expressions. A global device estimate, a provider statement about its services and a UTC deployment time do not yield an Australian device count.',
     'The 18 July time-zone basis and any customer-level allocation remain unresolved. Google attributes deployment information to CrowdStrike rather than independently proving it.')
path('Passenger recovery and reimbursement exceed technical restoration', ['EV-0011','EV-0012','EV-0015','EV-0016','EV-0009'],
     'Named accounts describe unavailable check-in help, days stranded in Osaka, and upfront hotel, food and transport costs. One account describes a conditional daily offer. A bounded search did not retrieve the specific airline notice or payment records.',
     'A provider recovery percentage and a traveller’s ability to return home or recover expenses are different outcomes. The source search narrows what was found in that search, not what exists everywhere.',
     'The cited accounts do not establish the final return date, receipts, repayment, every passenger experience or an incident-specific airline commitment.')
path('2024 outage impersonation: warning, action and victim proof', ['EV-0001','EV-0002','EV-0008'],
     'The Australian cyber advisory and consumer regulator warned of malicious recovery offers; the national signals agency reported impersonation sites, information-sharing and takedowns.',
     'An outage created an opportunity for impersonation. A warning, reported number of sites and defensive takedown describe different observations and should not be merged into a count of victims.',
     'These records do not establish a particular person’s credential theft, malware infection or financial loss.')
path('US aviation: ground stop, reopening and passenger recovery', ['EV-0017','EV-0018','EV-0019','EV-0025','EV-0042'],
     'The aviation agency described instability during maintenance and reopening at 20:15 Eastern Time; the transport secretary also announced reopening. United’s chief executive described operational effects. A Buffalo briefing counted 67 departure and 61 arrival cancellations over 13–16 November, and one passenger described being told to leave an aircraft.',
     'An airspace reopening is not the same event as every flight resuming or a passenger reaching a destination. Airport-period counts, a nationwide count and an individual account have distinct scopes.',
     'The agency said its underlying cause investigation was ongoing and had no cyberattack indication in information then available. These records do not allocate every cancellation to the ground stop or establish passenger compensation.')
path('Microsoft 365: reproduced notices and a third-party report', ['EV-0020','EV-0031'],
     'A university reproduced service notice MO1550821 with an impact interval of 12 November 16:20 to 13 November 16:10 UTC. A third-party-hosted report bearing Microsoft’s name matches the identifiers and interval and gives a technical explanation with separate backlog milestones.',
     'Matching identifiers and dates support identifying the reports as addressing the same stated incident; they do not independently authenticate the hosted report or establish its technical explanation.',
     'The original authenticated report, independent technical confirmation and each customer’s backlog outcome remain unestablished.')
path('Regional and local service clocks are not one timeline', ['EV-0022','EV-0020','EV-0027'],
     'Google described a US multi-region security-service incident using Pacific time and a third-party network explanation. A university recorded local Microsoft service impact and resolution in Australian time; the Microsoft incident extract uses UTC.',
     'Times must retain their time zones, service, region and source before comparing them. Local restoration need not coincide with a provider-wide impact interval.',
     'The records do not establish the same cause, the same affected users or continuous individual downtime.')
path('Emergency-service continuity is narrower than all service continuity', ['EV-0023','EV-0045','EV-0047','EV-0048'],
     'A UK minister reported emergency number and emergency department continuity; an uncorrected Tasmanian parliamentary proof records a minister’s account. Two ambulance providers reported emergency functions available while describing other communications or transport pressure.',
     'Reporting that core emergency functions continued coexists with documented disruption to other work. It is not a measure of every call, wait or local service.',
     'The Tasmanian document is an uncorrected proof. The accounts do not establish all patient outcomes or technical causes independently.')
path('Referral channels and recovery differ between organisations', ['EV-0040','EV-0041','EV-0046'],
     'One trust suspended an online self-referral route and later warned of slower responses. A second trust advised telephone contact for time-sensitive referrals. Essex provided a temporary telephone route and later advised confirmation of urgent referrals without a response.',
     'A fallback can change how urgent communication is made while local recovery and backlog handling proceed at different speeds.',
     'None of these notices measures every delayed referral, telephone wait, accessibility barrier or patient outcome.')
path('Patient portal and telephone as an alternate route', ['EV-0032','EV-0020'],
     'Washington University advised staff to check the patient portal and telephone patients for time-sensitive communications during Microsoft service degradation.',
     'The institution’s notice identifies an alternative to the affected communication route; the source records the direction and local observation rather than each use of the fallback.',
     'The record does not count patients reached, missed appointments, successful alternative contacts or health outcomes.')
path('Workday timekeeping: system return and backlog processing', ['EV-0024','EV-0039'],
     'Washington University told staff and student workers to keep hours manually. Brown reported direct time reporting and other functions unavailable, allowed use of physical time clocks where available, and reported restored access while automated processing caught up.',
     'An institution’s manual workaround and return of system access do not by themselves establish payroll accuracy, processing completion or the experience of workers without the same fallback.',
     'The records do not independently verify the vendor explanation, payroll completion, individual pay outcomes or a common cause with other incidents.')
path('Financial stability and individual payment experience', ['EV-0026','EV-0033','EV-0034'],
     'Australia’s prudential regulator reported disruption during the Microsoft outage while saying critical financial services continued and it saw no threat to financial stability. Plaid separately reported some Chase-connection errors; a report attributed an internal technical explanation to a Chase spokesperson.',
     'System-wide stability, a particular service connection and a customer’s payment completion answer different questions and use different scopes.',
     'These sources do not quantify missed payments or household loss, independently verify the bank’s technical account or establish a shared cause.')
path('Chase disruption and later vendor incident remain separate', ['EV-0033','EV-0034','EV-0036'],
     'Plaid reported intermittent Chase-connection errors on 16 November. A news report attributed an internal technical explanation to Chase. A later report reproduced Chase’s statement that vendors were targeted and some vendor-held marketing data may have been accessed; Chase said it found no connection to the earlier disruption.',
     'The chronology contains an outage account and a later vendor-security account. They can be compared without treating temporal proximity as proof that the vendor incident caused the outage.',
     'Independent confirmation of access, affected people, vendor identity and the asserted absence of a connection is not supplied.')
path('A planned terminal notice is not an observed terminal shutdown', ['EV-0035'],
     'A freight forwarder relayed an industry notice of a planned outage at the Brisbane DP World terminal on 20 November, 06:00–16:00, and warned of possible delays.',
     'A customer advisory is evidence that a planned interruption and possible delays were communicated. It is not an operator log of the actual terminal operation.',
     'The notice omits its time zone; actual closure, shipment delays, compromise and any connection to other events remain unverified.')
path('Agriculture messaging: published fallback and restoration', ['EV-0028','EV-0029'],
     'The department reported messaging disruption on 13 November, identified an online cargo-lodgement enquiry function as an alternative for some documents, and published a later messaging-restoration notice.',
     'The notices document the department’s stated workaround and reported restoration. Its Dynamics 365 reference should not be silently equated with the separately documented Microsoft 365 incident.',
     'The records do not establish actual workaround usage, every queued message’s delivery or the exact time of restoration.')
path('Cancelled maintenance is a separate planned event', ['EV-0030','EV-0028'],
     'The department cancelled scheduled 13–15 November maintenance outages and separately reported an unplanned messaging disruption.',
     'Cancellation of the announced maintenance windows resolves what the department said about that plan; it does not eliminate the separate unplanned service notice.',
     'The records do not establish a terminal outage, rule out other maintenance, or prove causation for the messaging disruption.')
path('Cargo lodgement interruption preceded its later fallback role', ['EV-0055','EV-0028'],
     'The department said cargo lodgements were affected as of approximately 09:12 Australian Eastern Daylight Time on 4 November and reported restoration at 11:45 on 5 November. On 13 November it suggested the enquiry function as a fallback for some documents.',
     'The fallback had a documented earlier interruption. That is a sequence across separate dated notices, not proof it was unavailable when offered.',
     'The exact beginning, number of affected lodgements, actual fallback use and common cause are not established.')
path('15 November cargo interruption and reported restoration', ['EV-0037','EV-0038'],
     'The department reported the cargo-lodgement system unavailable as of 10:30 on 15 November and reported resolution at 18:40 for several import and reporting systems.',
     'The records support distinct status and restoration milestones for the government service. They do not equate a reported restoration with completion of all delayed work.',
     'The status time is not necessarily the outage start; cause, individual lodgement results and terminal operation are not established.')
path('23 November cargo retry advice and restoration', ['EV-0043','EV-0044'],
     'The department reported a separate lodgement disruption as of approximately 07:36 on 23 November, advised retrying failed lodgements after restoration, and reported access restored at 09:51.',
     'Retry advice places a further action on affected users; the subsequent restoration notice does not establish that each retry or shipment succeeded.',
     'The notice does not provide a failure count, cause or individual outcomes; this episode is not automatically the same cause as earlier events.')
path('Hamilton: upstream recovery, local pause and queue processing', ['EV-0056'],
     'Hamilton City Council reported pausing online payments and applications, keeping them paused over the weekend even if Microsoft returned sooner, processing queued submissions at 10:30 local time on 16 November, and reporting services operating normally at 14:00.',
     'Upstream recovery, local restart and processing queued submissions are distinct stages. The council recorded what it said about each stage.',
     'The notice does not establish when every queued item completed, each resident’s access to alternatives or independently confirm a technical cause.')
path('Museum deadline extension and individual outcomes', ['EV-0062'],
     'A museum notice attributed a disrupted quotation-closing process to a Microsoft outage or technical issue and extended two deadlines from 13 November to noon on 17 November.',
     'The notice records a specific institutional response and revised opportunity to submit; it makes the practical deadline change visible.',
     'It does not establish how many bidders were affected, whether any missed the original deadline, or whether all later submissions succeeded.')
path('GitHub pull requests: two reports and later edited explanations', ['EV-0049','EV-0050'],
     'GitHub reported pull-request incidents on 13 and 16 November. The present resolution text for the 13 November event was modified on 23 November; the corresponding 16 November text was modified on 20 November. The later account attributes both to storage read-bandwidth saturation and a disk setting.',
     'An update’s original creation time is not the publication time of its present edited wording. The two copies of the same provider explanation are not independent corroboration.',
     'Earlier update text is not present in the saved feed; do not reconstruct it or independently certify the operator’s cause or customer outcomes.')
path('Copilot: unnamed upstream provider and model choice', ['EV-0051','EV-0064'],
     'GitHub reported degraded availability of specified Copilot models and attributed the issue to an unnamed upstream model provider, suggesting another model. Anthropic separately named Microsoft 365 in its own connector incident.',
     'An explicitly unnamed upstream provider in one incident cannot be identified by borrowing the named provider in a separate record.',
     'The records do not establish the provider identity for the GitHub notice, a common cause, compromise or individual recovery.')
path('Outage-themed phishing: reported overlap; sample independence unknown', ['EV-0021','EV-0052','EV-0053'],
     'Microsoft reported outage-themed phishing. Trellix described 252 messages across more than 30 organisations in its observed 13 November window. Cofense described a fake sign-in and retry flow. The reports identify overlapping infrastructure.',
     'The shared indicators connect the published descriptions; they do not by themselves show separate samples, one operator or an observed successful compromise.',
     'Microsoft did not confirm credential capture, malware delivery or post-compromise activity in its report. A named actor and the cause of the outage remain unestablished.')
path('Security-control observations have different sample boundaries', ['EV-0021','EV-0063','EV-0053'],
     'Cofense reported its campaign bypassed three named email-security controls. Microsoft separately described blocking and quarantining the campaign it reported.',
     'Different samples, configurations and timing can make both descriptions possible. Without a same-message comparison the records do not establish a contradiction.',
     'Neither source proves the outage disabled controls, a user submitted working credentials or an account was taken over.')
path('Phishing telemetry ratios and message counts measure different things', ['EV-0054','EV-0052'],
     'KnowBe4 reported approximately 468 times its three-day daily detection baseline and 187 times its user-report baseline. Trellix reported 252 messages across more than 30 organisations in a defined window.',
     'Ratios against one product’s baseline and a second researcher’s bounded message count are not interchangeable global totals; the underlying samples may overlap.',
     'Absolute KnowBe4 counts, representativeness, unique recipients and successful compromise are not established.')
path('Replicate registry: repeated reported restrictions', ['EV-0057','EV-0059'],
     'Cloudflare reported degraded uploads and unavailable model builds or pushes during an 11–13 November registry incident, then a separate registry restriction on 13–14 November.',
     'The source records a second restriction after a prior reported resolution. It establishes recurring availability reports, not that the first fix failed or the events had a common cause.',
     'The original wording of an edited 11 November update is unavailable; provider cause and customer outcomes are unverified.')
path('Replicate predictions: a sequence of distinct incidents', ['EV-0058','EV-0060','EV-0061'],
     'Cloudflare separately described increased prediction errors on 12 November, creation errors on 16 November, and errors or stalled predictions on 17–18 November. During the last incident it reported OpenAI-model predictions normal while others might still fail.',
     'The reports distinguish several events and different recovery stages rather than one undifferentiated availability flag.',
     'The records do not establish the same cause, customer counts, the outcome of every prediction or a connection to unrelated outages.')
path('Anthropic connector: named upstream dependency and delayed status update', ['EV-0064','EV-0020'],
     'Anthropic attributed Microsoft 365 connector and Claude for Outlook errors to a Microsoft service incident. Its reported impact interval ended at 16:40 UTC on 13 November; at 21:49 it marked its incident resolved while warning occasional errors could remain during Microsoft recovery.',
     'The attribution identifies a provider-stated dependency. Reported impact-end, later publication of a resolved status, and completion of upstream recovery are different milestones.',
     'The provider account does not prove the underlying Microsoft root cause, every customer outcome or backlogs completed.')
path('OpenAI connector: timing overlap is not source attribution', ['EV-0065','EV-0064','EV-0020'],
     'OpenAI reported errors and subsequent recovery for its Microsoft 365 connector. Anthropic explicitly attributed its own connector incident to Microsoft; the OpenAI notice does not provide the same attribution.',
     'Similar product names and overlapping times create a comparison to investigate, not proof that the two provider incidents had the same technical cause.',
     'The OpenAI record does not establish individual customer recovery or independently authenticate the other provider’s explanation.')
path('GitHub and Codex: provider attribution without named incident ID', ['EV-0066','EV-0067'],
     'On 25 November GitHub reported multi-product degradation, marked it resolved at 16:52 UTC and said a detailed root-cause analysis would follow. At 16:58 UTC OpenAI said GitHub had mitigated a disruption and it was monitoring Codex review and merge recovery.',
     'OpenAI attributes some Codex failures to a GitHub disruption; its notice does not identify the particular GitHub incident. The two providers’ status milestones cannot be collapsed into one proof of downstream completion.',
     'Matching times alone do not establish the specific incident-to-incident link, complete cause, current status beyond capture or every review and merge outcome.')
path('Phishing telemetry: four reported waves and changing lures', ['EV-0052'],
     'In the preserved Trellix report, the researchers divide their 13 November observation into four UTC windows: 91 messages from 17:04–18:10, 17 from 18:58–19:01, 124 from 19:41–20:14, and 20 from 20:35–20:38. The final wave used a security-check framing after earlier outage or message-restoration framing.',
     'The 252-message total contains four temporally distinct waves and a change in the wording used to solicit action. Retaining the windows avoids compressing the observed sequence into one undifferentiated count.',
     'The figures are Trellix’s bounded telemetry, not worldwide counts, identified victims, proof of different actors, successful compromise or a cause of the outage. No malicious destination is contacted or published by this analysis.')
path('Hamilton reporting channel: alternate routes during the local pause', ['EV-0056'],
     'In the original council page captured for EV-0056, its 14 November update said it could not receive or process reports submitted through the Antenno app, asked residents to hold off, and identified telephone and Facebook as alternatives. It also said council facilities remained open.',
     'The source records a separate public reporting-channel interruption in addition to paused online payments and applications. The advice to use alternate channels is part of the published service sequence; use of those channels is not established.',
     'The case’s short evidence summary does not itself include this detail; it is drawn from the separately preserved full original. The source does not establish uptake, accessibility, reporting delays or individual outcomes.')
path('Essex notice: body timestamps and later page metadata', ['EV-0046'],
     'The preserved Essex page labels updates 10:30 am and 4 pm on 13 November. Embedded page metadata gives publication at 10:11:59 UTC and modification at 16:36:53 UTC that day.',
     'The later capture retains the body headings and page metadata together. The modification timestamp means the current page wording should not automatically be treated as an independently preserved version from each heading time.',
     'Page metadata is publisher-supplied, not independent timestamp authentication. The earlier page versions are not in this capture, and no missing wording is reconstructed.')

# Each mechanism names the specific evidence relationship under examination.
# This labels an analytical interpretation; the cited source accounts remain
# distinguished from independently verified facts by each path's boundary.
mechanisms = [
 ('Measurement-unit mismatch','A revised count of unsuccessful calls and a regulator count of people are not the same denominator.'),
 ('Radio-presence and calling-path separation','A visible radio signal can coexist with inability to complete a call; the review describes the fallback constraint.'),
 ('Technical rollback versus recovery','The reported reversal of a configuration and the later restoration of affected devices are distinct milestones.'),
 ('Search-boundary limitation','A negative search of a particular edition cannot establish that another source lacks the sought information.'),
 ('Population and timezone mismatch','A global estimate, cloud-provider report and timed operator filing describe different quantities and time bases.'),
 ('Recovery-cost transfer','Named travellers describe time and out-of-pocket costs after the technical interruption; later compensation remains unproven.'),
 ('Disruption-exploiting impersonation','Published warnings describe criminals using the disruption as a recovery pretext; victim outcomes require separate proof.'),
 ('Infrastructure reopening versus passenger recovery','Airspace reopening, airport counts and a passenger’s experience measure separate stages and populations.'),
 ('Reproduction and provenance','A tenant notice and a separately hosted report can match identifiers while remaining insufficient to authenticate each other.'),
 ('Region and timezone separation','A US regional network account and Australian local service notices have distinct geographies and clocks.'),
 ('Core-service continuity with adjacent disruption','Reports of operational emergency functions coexist with reported disruption to other communication or transport functions.'),
 ('Alternate-channel transfer','The institutions directed urgent communication through phone or other routes; the effort, accessibility and outcome for each person are not measured.'),
 ('Portal and telephone fallback','Staff were directed to check a separate portal and telephone patients; actual use and benefit are not measured.'),
 ('Manual timekeeping and backlog transfer','Workday unavailability shifted recording of hours to staff and student workers where instructed; the sources do not establish subsequent pay loss or completion.'),
 ('Aggregate stability versus individual completion','A stability-level assessment does not measure whether each customer payment or connection completed.'),
 ('Distinct outage and security event','The bank’s service disruption and later vendor incident have separate dates and accounts; the bank’s separation claim requires its own support.'),
 ('Planned versus executed operation','A freight notice of a scheduled interruption is evidence of communication, not an observed terminal closure.'),
 ('Fallback dependency','A messaging disruption led the department to direct some documents through a cargo-lodgement enquiry route.'),
 ('Planned change cancellation','A cancelled scheduled window and a separate unplanned interruption must be retained as different events.'),
 ('Fallback with prior interruption','The later-used fallback had an earlier reported interruption; its availability on the day offered is not established by that earlier record.'),
 ('Multi-system restoration milestone','A government notice reports several services restored at one time; it does not show completion of every delayed transaction.'),
 ('User retry after service recovery','Users were advised to retry failed lodgements once access returned; actual retry and completion are not shown.'),
 ('Upstream recovery versus local restart','Hamilton reported keeping its own payment and application services paused while the upstream service was recovering, with queued items later being processed.'),
 ('Deadline change and outcome separation','The published extension changed a submission deadline; it does not reveal individual bid outcomes.'),
 ('Versioned incident text','Present resolution text had later modification times, and duplicate provider explanations are not independent confirmation.'),
 ('Unidentified upstream provider','An unnamed provider in one account cannot be filled in from a separate incident with a named provider.'),
 ('Indicator overlap without sample identity','Reported shared indicators relate descriptions but do not establish independent samples or a single operator.'),
 ('Control-observation comparability','Different products, samples and configurations limit comparison of claimed bypass and blocking.'),
 ('Incompatible telemetry units','A count in a time window and ratios to a three-day baseline cannot be aggregated as one global total.'),
 ('Reported recurrence across incidents','A second registry restriction follows an earlier reported resolution without an established shared cause.'),
 ('Partial model recovery','The source separately records recovery for one model group and possible remaining errors for others.'),
 ('Named upstream service dependency','Anthropic attributes its connector errors to Microsoft while separately timing its own resolved update and upstream recovery caveat.'),
 ('Timing overlap without attribution','Overlapping provider notices do not supply a missing causal statement.'),
 ('Upstream attribution without exact incident identifier','A GitHub disruption is cited by OpenAI, but its notice does not name the specific GitHub status incident.'),
 ('Phishing-wave timing and framing','Four source-reported time windows have distinct counts and a shift from outage or restoration lures to a security-check pretext.'),
 ('Public issue reporting channel displacement','A local authority reported an issue-reporting app unavailable and directed residents to alternate channels, without measuring the outcome.'),
 ('Body-heading and page-version distinction','A later captured page has body update labels and separate publication/modification metadata; earlier text is unavailable.')
]
if len(mechanisms) != len(paths):
    raise ValueError('Each path needs its own mechanism annotation')
for entry, (label, explanation) in zip(paths, mechanisms):
    entry['determinations'] = [[entry['id'] + '.1', entry['analysis']]]
    entry['mechanisms'] = [[label, 'Evidence-constrained interpretation', explanation]]

cross_paths = [
  {'id':'CPO-001','title':'Restoration is not the end of every dependent task',
   'paths':['AR-003','AR-006','AR-012','AR-014','AR-023','AR-024','AR-031','AR-032'],
   'analysis':'Providers and institutions report several different milestones: reverting an update, restoring access, processing queues, changing a deadline, and recovering particular models. These are not a single outcome for the people and organisations depending on them.',
   'boundary':'This convergence does not establish that any particular individual remained harmed or that each incident had the same cause.'},
  {'id':'CPO-002','title':'Alternative routes can transfer practical work',
   'paths':['AR-012','AR-013','AR-014','AR-018','AR-022','AR-036'],
   'analysis':'Published instructions direct some communications through phone or portals, staff to record hours separately, and some cargo users to use a different route or retry. The documented action can move effort or dependency to the people using the alternative.',
   'boundary':'The sources do not measure the burden for every person, the use of each alternative, or a specific adverse outcome.'},
  {'id':'CPO-003','title':'Temporal proximity does not establish a shared cause',
   'paths':['AR-010','AR-016','AR-020','AR-025','AR-030','AR-033','AR-034'],
   'analysis':'The records contain several events with overlapping dates or named upstream services. Some reports explicitly attribute a dependency, others describe separate causes or provide no link. Each relationship has its own evidentiary basis.',
   'boundary':'The comparison neither proves a common cause nor proves that every potential connection is absent.'},
  {'id':'CPO-004','title':'Source versions and measurements affect what can be concluded',
   'paths':['AR-001','AR-004','AR-005','AR-025','AR-027','AR-029','AR-035','AR-037'],
   'analysis':'The material includes different counting units, a bounded negative search, time-zone differences, later-edited status text and vendor-specific telemetry. Their original context changes what the comparison can support.',
   'boundary':'A shared identifier or repeated provider explanation is not automatically independent corroboration; missing earlier wording is not reconstructed.'}
]

coverage = {item['evidence_id']: [] for item in evidence}
for p in paths:
    for item in p['anchors']:
        coverage[item].append(p['id'])
for item in evidence:
    item['_referenced_in'] = coverage[item['evidence_id']]

evidence_blob = subprocess.check_output(['git', 'show', 'HEAD:cases/INV-TECH-CYBER-001/data/evidence_register.json'], cwd=ROOT)
source_blob = subprocess.check_output(['git', 'show', 'HEAD:cases/INV-TECH-CYBER-001/data/source_register.json'], cwd=ROOT)
repo_revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
stage = {
  'analysis_id': 'DFAPTA-INV-TECH-CYBER-001', 'dfapti_case_id': 'INV-TECH-CYBER-001',
  'status': 'In progress — live and continuing', 'started_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'evidence_basis_note': 'This analysis uses a dated, hash-identified reading of the live evidence register. It is a checkpoint for traceability, not a freeze. New evidence and analysis continue; later analysis appends new paths or dated corrections without overwriting earlier paths. A path reference is not a finding of truth and does not prove all paths were taken.',
  'basis': {'repository_revision': repo_revision, 'evidence_register_sha256': hashlib.sha256(evidence_blob).hexdigest(),
            'source_register_sha256': hashlib.sha256(source_blob).hexdigest(),
            'evidence_count': len(evidence), 'source_count': len(sources), 'chronology_count': len(chronology),
            'verification_states': dict(collections.Counter(x.get('verification_state','Not stated') for x in evidence)),
            'preserved_reference_note': '51 case-referenced descriptions/extracts match their committed-byte hashes; the first 16 entries have no preserved file reference. A description or extract is not the full original response. Original responses for later records may be stored separately.'},
  'paths': paths, 'cross_path_observations': cross_paths, 'coverage': coverage,
  'coverage_note': 'References identify which evidence entries appear in at least one path at this checkpoint. They do not establish comprehensive source review, independent verification, causal proof or that the investigation is finished.',
  'contradictions_note': 'Retain the case contradiction register and all prior records; an unresolved issue is not silently resolved by an analysis path.',
  'unanchored_evidence': [k for k,v in coverage.items() if not v]
}
OUT.write_text(json.dumps(stage, indent=2, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
print(f'Created {len(paths)} paths; {sum(bool(x) for x in coverage.values())}/{len(coverage)} evidence identifiers cited; unanchored {stage["unanchored_evidence"]}')
