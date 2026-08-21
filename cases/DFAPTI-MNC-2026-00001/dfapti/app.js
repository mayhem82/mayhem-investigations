(function () {
  'use strict';

  var DATA_PATHS = {
    case: '../data/case.json',
    evidence: '../data/evidence_register.json',
    sources: '../data/source_register.json',
    chronology: '../data/chronology.json',
    contradictions: '../data/contradictions.json',
    questions: '../data/open_questions.json',
    threads: '../data/threads.json',
    automationLog: '../data/automation_log.json',
    notes: '../data/investigation_notes.json',
    decisions: '../data/decisions.json',
    searchLog: '../data/search_log.json',
  };

  var NOTES_REFRESH_INTERVAL_MS = 15000;

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    for (var key in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, key)) continue;
      if (key === 'class') node.className = attrs[key];
      else if (key === 'html') node.innerHTML = attrs[key];
      else node.setAttribute(key, attrs[key]);
    }
    (children || []).forEach(function (child) {
      if (child === null || child === undefined) return;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  function slug(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function badge(value) {
    if (!value) return el('span', { class: 'badge' }, ['-']);
    return el('span', { class: 'badge badge-' + slug(value) }, [value]);
  }

  function idTag(value) {
    return el('span', { class: 'id-tag' }, [value]);
  }

  // ---------------------------------------------------------------
  // Cross-reference links
  //
  // Every register cites related records by ID (relationships,
  // supporting_evidence, dependencies, etc.). This maps an ID's prefix to
  // the workspace section that owns records of that type, so any such ID
  // can be rendered as a real link that jumps to and opens that record,
  // instead of inert text.
  // ---------------------------------------------------------------

  var ID_PREFIX_SECTIONS = [
    ['EV-', 'evidence'],
    ['CHR-', 'chronology'],
    ['SRC-', 'sources'],
    ['CTR-', 'contradictions'],
    ['THR-', 'threads'],
    ['NOTE-', 'notes'],
    ['DEC-', 'decisions'],
    ['SRCH-', 'searchlog'],
    ['Q-', 'questions'],
  ];

  function sectionForId(id) {
    var found = ID_PREFIX_SECTIONS.filter(function (pair) {
      return String(id || '').indexOf(pair[0]) === 0;
    })[0];
    return found ? found[1] : null;
  }

  function openRecord(id) {
    var target = document.getElementById('record-' + id);
    if (!target) return;
    target.open = true;
    target.scrollIntoView({ block: 'start' });
  }

  function navigateToRecord(id) {
    var section = sectionForId(id);
    if (!section) return;
    showSection(section, id);
  }

  function linkedTag(id, label) {
    var text = label || id;
    var section = sectionForId(id);
    if (!section) return el('span', { class: 'tag-chip' }, [text]);
    var btn = el('button', { class: 'tag-chip tag-chip-link', type: 'button' }, [text]);
    btn.addEventListener('click', function () { navigateToRecord(id); });
    return btn;
  }

  function tagList(ids) {
    if (!ids || !ids.length) return el('span', { class: 'kv-value' }, ['None']);
    var wrap = el('div', { class: 'tag-list' });
    ids.forEach(function (id) {
      wrap.appendChild(linkedTag(id));
    });
    return wrap;
  }

  function kv(label, valueNode) {
    var value = (valueNode instanceof Node) ? valueNode : el('div', { class: 'kv-value' }, [String(valueNode === null || valueNode === undefined || valueNode === '' ? '-' : valueNode)]);
    return el('div', { class: 'kv-row' }, [
      el('div', { class: 'kv-label' }, [label]),
      value,
    ]);
  }

  function emptyState(message) {
    return el('div', { class: 'empty-state' }, [message]);
  }

  function recordCard(recordId, titleNode, subtitle, bodyRows) {
    var summary = el('summary', {}, [
      el('div', { class: 'record-title' }, [titleNode]),
      subtitle ? el('div', { class: 'record-sub' }, [subtitle]) : null,
    ]);
    var body = el('div', { class: 'record-body' }, bodyRows);
    var attrs = { class: 'record' };
    if (recordId) attrs.id = 'record-' + recordId;
    return el('details', attrs, [summary, body]);
  }

  function setFilterable(containerId, getSearchText) {
    var input = document.querySelector('.filter-input[data-filter-target="' + containerId + '"]');
    if (!input) return;
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      var container = document.getElementById(containerId);
      Array.prototype.forEach.call(container.children, function (child) {
        var text = getSearchText(child).toLowerCase();
        child.hidden = q.length > 0 && text.indexOf(q) === -1;
      });
    });
  }

  // ---------------------------------------------------------------
  // Renderers
  // ---------------------------------------------------------------

  function lastN(arr, n) {
    return arr.slice(Math.max(0, arr.length - n));
  }

  function jumpLink(label, sectionName) {
    var btn = el('button', { class: 'jump-link' }, [label]);
    btn.addEventListener('click', function () { showSection(sectionName); });
    return btn;
  }

  function resumeCard(title, countLabel, items, emptyText, sectionName, jumpLabel) {
    var body = [];
    if (items.length) {
      items.forEach(function (line) { body.push(el('div', { class: 'resume-line' }, [line])); });
    } else {
      body.push(el('div', { class: 'resume-line resume-empty' }, [emptyText]));
    }
    body.push(jumpLink(jumpLabel, sectionName));
    return el('div', { class: 'card stack' }, [
      el('div', { class: 'resume-card-header' }, [
        el('span', { class: 'record-title' }, [title]),
        el('span', { class: 'record-sub' }, [countLabel]),
      ]),
    ].concat(body));
  }

  function renderResume(caseDef, evidence, chronology, contradictions, questions, threads, automationLog, decisions) {
    var target = document.getElementById('resume-content');
    target.innerHTML = '';
    if (!caseDef) {
      target.appendChild(emptyState('Case definition could not be loaded.'));
      return;
    }

    var header = el('div', { class: 'card stack' }, [
      kv('Case', el('span', {}, [idTag(caseDef.case_identifier), ' — ', caseDef.case_title])),
      kv('Status', badge(caseDef.current_status)),
    ]);
    target.appendChild(header);

    target.appendChild(resumeCard(
      'Evidence Register',
      evidence.length + ' item(s)',
      lastN(evidence, 5).map(function (e) { return e.evidence_id + ' — ' + e.source_title + ' (' + e.verification_state + ')'; }),
      'No evidence collected yet.',
      'evidence', 'Open Evidence Register'
    ));

    target.appendChild(resumeCard(
      'Chronology',
      chronology.length + ' entr' + (chronology.length === 1 ? 'y' : 'ies'),
      lastN(chronology, 5).map(function (c) { return c.event_date + ' — ' + c.event_description + ' [' + c.status + ']'; }),
      'Chronology is empty.',
      'chronology', 'Open Chronology'
    ));

    var openContradictions = contradictions.filter(function (c) { return c.status === 'Open' || c.status === 'Partially Resolved'; });
    target.appendChild(resumeCard(
      'Contradictions',
      openContradictions.length + ' open/partial of ' + contradictions.length,
      openContradictions.map(function (c) { return c.contradiction_id + ' — ' + c.description; }),
      'No open contradictions.',
      'contradictions', 'Open Contradiction Register'
    ));

    var unresolvedQuestions = questions.filter(function (q) { return q.status === 'Open'; });
    target.appendChild(resumeCard(
      'Open Questions',
      unresolvedQuestions.length + ' unresolved of ' + questions.length,
      unresolvedQuestions.map(function (q) { return q.question_id + ' — ' + q.question; }),
      'No unresolved questions.',
      'questions', 'Open Question Register'
    ));

    var activeThreads = threads.filter(function (t) { return t.completion_state !== 'Complete'; });
    target.appendChild(resumeCard(
      'Investigation Threads',
      activeThreads.length + ' active of ' + threads.length,
      activeThreads.map(function (t) { return t.thread_id + ' ' + t.name + ' — ' + t.status; }),
      'No active threads.',
      'threads', 'Open Investigation Threads'
    ));

    target.appendChild(resumeCard(
      'Decision Register',
      decisions.length + ' decision(s)',
      lastN(decisions, 3).map(function (d) { return d.decision_id + ' (' + d.date + ') — ' + d.reason; }),
      'No operating decisions recorded yet.',
      'decisions', 'Open Decision Register'
    ));

    var lastRun = automationLog.length ? automationLog[automationLog.length - 1] : null;
    target.appendChild(el('div', { class: 'card stack' }, [
      el('div', { class: 'record-title' }, ['Last Automation Run']),
      el('div', { class: 'resume-line' }, [lastRun ? (lastRun.run_id + ' (' + lastRun.date + ') — ' + lastRun.result) : 'No automation runs recorded yet.']),
    ]));
  }

  function renderCase(caseDef) {
    var target = document.getElementById('overview-content');
    target.innerHTML = '';
    if (!caseDef) {
      target.appendChild(emptyState('Case definition could not be loaded.'));
      return;
    }
    document.getElementById('header-case-id').textContent = caseDef.case_identifier || 'DFAPTI-MNC-2026-00001';
    var card = el('div', { class: 'card stack' }, [
      kv('Case Identifier', idTag(caseDef.case_identifier)),
      kv('Case Title', caseDef.case_title),
      kv('Investigation Type', caseDef.investigation_type),
      kv('Jurisdiction', caseDef.jurisdiction),
      kv('Geographic Scope', caseDef.geographic_scope),
      kv('Commencement Date', caseDef.commencement_date),
      kv('Current Status', badge(caseDef.current_status)),
      kv('Investigator', caseDef.investigator),
      kv('Repository Version', caseDef.repository_version),
      kv('Specification Version', caseDef.specification_version),
    ]);
    target.appendChild(card);
  }

  function renderEvidence(list) {
    var container = document.getElementById('evidence-list');
    document.getElementById('evidence-count').textContent = list.length + ' item(s)';
    container.innerHTML = '';
    if (!list.length) {
      container.appendChild(emptyState('No evidence has been collected yet. Evidence collection has not started for this case.'));
      return;
    }
    list.forEach(function (e) {
      var card = recordCard(
        e.evidence_id,
        el('span', {}, [idTag(e.evidence_id), ' — ', e.source_title || '']),
        (e.source_authority || '') + (e.source_date ? ' · ' + e.source_date : ''),
        [
          kv('Case', idTag(e.case_id)),
          kv('Source Type', badge(e.source_type)),
          kv('Classification', badge(e.classification)),
          kv('Verification State', badge(e.verification_state)),
          kv('Source Location', e.source_location),
          kv('Preserved File Reference', e.preserved_file_reference),
          kv('Document Hash', e.document_hash),
          kv('Recording Date', e.recording_date),
          kv('Description', e.evidence_description),
          kv('Relevant Quotation', e.relevant_quotation),
          kv('Investigation Relevance', e.investigation_relevance),
          kv('Relationships', tagList(e.relationships)),
          kv('Chronology Links', tagList(e.chronology_links)),
          kv('Contradiction Links', tagList(e.contradiction_links)),
          kv('Open Question Links', tagList(e.open_question_links)),
        ]
      );
      container.appendChild(card);
    });
  }

  // event_date is a free-text field (DATA_MODEL: "ISO date, or approximate
  // text") - entries range from full "2019-10-28" to bare years like "1967"
  // or annotated text like "2024 (by August)". Pull out the leading
  // YYYY[-MM[-DD]] prefix so entries sort chronologically regardless of how
  // precisely each date is known; entries with no parseable leading date
  // sort first (oldest/unknown) rather than being silently dropped.
  function chronologySortKey(eventDate) {
    var match = /^\d{4}(-\d{2}(-\d{2})?)?/.exec(String(eventDate || ''));
    return match ? match[0] : '';
  }

  function renderChronology(list) {
    var container = document.getElementById('chronology-list');
    document.getElementById('chronology-count').textContent = list.length + ' entr' + (list.length === 1 ? 'y' : 'ies');
    container.innerHTML = '';
    if (!list.length) {
      container.appendChild(emptyState('The chronology is empty. No events have been confirmed yet.'));
      return;
    }
    var sorted = list.slice().sort(function (a, b) {
      return chronologySortKey(a.event_date).localeCompare(chronologySortKey(b.event_date));
    });
    sorted.forEach(function (c) {
      var card = recordCard(
        c.chronology_id,
        el('span', {}, [idTag(c.chronology_id), ' — ', c.event_date || '', c.date_is_inference ? ' (inferred)' : '']),
        c.event_description,
        [
          kv('Status', badge(c.status)),
          kv('Date is Inference', c.date_is_inference ? 'Yes' : 'No'),
          kv('Description', c.event_description),
          kv('Supporting Evidence', tagList(c.supporting_evidence)),
        ]
      );
      container.appendChild(card);
    });
  }

  function renderSources(list) {
    var container = document.getElementById('sources-list');
    document.getElementById('sources-count').textContent = list.length + ' source(s)';
    container.innerHTML = '';
    if (!list.length) {
      container.appendChild(emptyState('No sources have been approved and registered yet.'));
      return;
    }
    list.forEach(function (s) {
      var card = recordCard(
        s.source_id,
        el('span', {}, [idTag(s.source_id), ' — ', s.title || '']),
        s.authority,
        [
          kv('Type', badge(s.type)),
          kv('URL / File Location', s.url_or_file_location),
          kv('First Checked', s.first_checked),
          kv('Last Checked', s.last_checked),
          kv('Current Version', s.current_version),
          kv('Preservation Status', badge(s.preservation_status)),
          kv('Hash Status', badge(s.hash_status)),
          kv('Associated Thread', s.associated_thread ? linkedTag(s.associated_thread) : '-'),
          kv('Availability Notes', s.availability_notes),
        ]
      );
      container.appendChild(card);
    });
  }

  function renderContradictions(list) {
    var container = document.getElementById('contradictions-list');
    document.getElementById('contradictions-count').textContent = list.length + ' contradiction(s)';
    container.innerHTML = '';
    if (!list.length) {
      container.appendChild(emptyState('No contradictions have been identified yet.'));
      return;
    }
    list.forEach(function (c) {
      var card = recordCard(
        c.contradiction_id,
        el('span', {}, [idTag(c.contradiction_id), ' — ', c.description || '']),
        null,
        [
          kv('Status', badge(c.status)),
          kv('Description', c.description),
          kv('Supporting Evidence', tagList(c.supporting_evidence)),
          kv('Opposing Evidence', tagList(c.opposing_evidence)),
          kv('Material Significance', c.material_significance),
          kv('Required Resolution', c.required_resolution),
          kv('Resolution Evidence', tagList(c.resolution_evidence)),
        ]
      );
      container.appendChild(card);
    });
  }

  function renderQuestions(list) {
    var container = document.getElementById('questions-list');
    document.getElementById('questions-count').textContent = list.length + ' question(s)';
    container.innerHTML = '';
    if (!list.length) {
      container.appendChild(emptyState('No open questions have been recorded yet.'));
      return;
    }
    list.forEach(function (q) {
      var card = recordCard(
        q.question_id,
        el('span', {}, [idTag(q.question_id), ' — ', q.question || '']),
        null,
        [
          kv('Status', badge(q.status)),
          kv('Question', q.question),
          kv('Why This Question Exists', q.why_exists),
          kv('Evidence Creating Question', tagList(q.evidence_creating_question)),
          kv('Evidence Required to Resolve', q.evidence_required_to_resolve),
          kv('Likely Source', q.likely_source),
          kv('Resolution Evidence', tagList(q.resolution_evidence)),
        ]
      );
      container.appendChild(card);
    });
  }

  // Actions to Take: a derived checklist, not a stored register (same
  // principle as the Relationship Map - computed from data that already
  // exists elsewhere rather than duplicated). Two parts: open questions
  // restated as "what to go find," and sources where automated fetch
  // failed and a human needs to retrieve the document directly.
  function isBlockedSource(s) {
    var text = ((s.current_version || '') + ' ' + (s.availability_notes || '')).toLowerCase();
    return s.preservation_status === 'Not Preserved' &&
      (text.indexOf('403') !== -1 || text.indexOf('blocked') !== -1 || text.indexOf('egress') !== -1);
  }

  function renderActions(questions, sources) {
    var openQuestions = questions.filter(function (q) { return q.status === 'Open'; });
    var qContainer = document.getElementById('actions-questions-list');
    document.getElementById('actions-questions-count').textContent = openQuestions.length + ' open question(s)';
    qContainer.innerHTML = '';
    if (!openQuestions.length) {
      qContainer.appendChild(emptyState('No open questions currently need evidence.'));
    } else {
      openQuestions.forEach(function (q) {
        qContainer.appendChild(recordCard(
          'action-' + q.question_id,
          el('span', {}, [idTag(q.question_id), ' — ', q.question || '']),
          null,
          [
            kv('What Would Resolve This', q.evidence_required_to_resolve),
            kv('Where to Look', q.likely_source),
          ]
        ));
      });
    }

    var blocked = sources.filter(isBlockedSource);
    var bContainer = document.getElementById('actions-blocked-list');
    document.getElementById('actions-blocked-count').textContent = blocked.length + ' source(s)';
    bContainer.innerHTML = '';
    if (!blocked.length) {
      bContainer.appendChild(emptyState('No sources are currently flagged as blocked to automated fetch.'));
    } else {
      blocked.forEach(function (s) {
        bContainer.appendChild(recordCard(
          'action-' + s.source_id,
          el('span', {}, [idTag(s.source_id), ' — ', s.title || '']),
          s.authority,
          [
            kv('URL', el('a', { href: s.url_or_file_location, target: '_blank', rel: 'noopener noreferrer' }, [s.url_or_file_location])),
            kv('Why It\'s Blocked', s.current_version),
            kv('What Retrieving It Would Confirm', s.availability_notes),
          ]
        ));
      });
    }
  }

  function renderThreads(list) {
    var container = document.getElementById('threads-list');
    document.getElementById('threads-count').textContent = list.length + ' thread(s)';
    container.innerHTML = '';
    if (!list.length) {
      container.appendChild(emptyState('No investigation threads defined.'));
      return;
    }
    list.forEach(function (t) {
      var card = recordCard(
        t.thread_id,
        el('span', {}, [idTag(t.thread_id), ' — ', t.name || '']),
        null,
        [
          kv('Status', badge(t.status)),
          kv('Completion State', badge(t.completion_state)),
          kv('Outstanding Work', t.outstanding_work),
          kv('Dependencies', tagList(t.dependencies)),
          kv('Supporting Evidence', tagList(t.supporting_evidence)),
        ]
      );
      container.appendChild(card);
    });
  }

  // Sorts append-only, never-renumbered ID-prefixed records newest-first
  // by the numeric part of their ID (e.g. "DEC-0012" -> 12), since several
  // can share the same day-granularity date field.
  function byIdDescending(idField) {
    return function (a, b) {
      var na = parseInt(String(a[idField] || '').replace(/\D/g, ''), 10) || 0;
      var nb = parseInt(String(b[idField] || '').replace(/\D/g, ''), 10) || 0;
      return nb - na;
    };
  }

  function renderDecisions(list) {
    var container = document.getElementById('decisions-list');
    document.getElementById('decisions-count').textContent = list.length + ' decision(s)';
    container.innerHTML = '';
    if (!list.length) {
      container.appendChild(emptyState('No operating decisions have been recorded yet.'));
      return;
    }
    var sorted = list.slice().sort(byIdDescending('decision_id'));
    sorted.forEach(function (d) {
      var card = recordCard(
        d.decision_id,
        el('span', {}, [idTag(d.decision_id), ' — ', d.date || '']),
        null,
        [
          kv('Date', d.date),
          kv('Investigator', d.investigator),
          kv('Reason', d.reason),
          kv('Impact', d.impact),
          kv('Supporting Evidence', tagList(d.supporting_evidence)),
        ]
      );
      container.appendChild(card);
    });
  }

  function renderSearchLog(list) {
    var container = document.getElementById('searchlog-list');
    document.getElementById('searchlog-count').textContent = list.length + ' search(es)';
    container.innerHTML = '';
    if (!list.length) {
      container.appendChild(emptyState('No searches have been logged yet.'));
      return;
    }
    var sorted = list.slice().sort(byIdDescending('search_id'));
    sorted.forEach(function (s) {
      var card = recordCard(
        s.search_id,
        el('span', {}, [idTag(s.search_id), ' — ', s.search_terms || '']),
        null,
        [
          kv('Date', s.date),
          kv('Time', s.time),
          kv('Search Terms', s.search_terms),
          kv('Search Engine', s.search_engine),
          kv('Database', s.database),
          kv('Filters', s.filters),
          kv('Jurisdiction', s.jurisdiction),
          kv('Results Reviewed', s.results_reviewed === null || s.results_reviewed === undefined ? '-' : String(s.results_reviewed)),
          kv('Results Preserved', s.results_preserved === null || s.results_preserved === undefined ? '-' : String(s.results_preserved)),
        ]
      );
      container.appendChild(card);
    });
  }

  function formatTimestamp(ts) {
    if (!ts) return '-';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function renderNotes(list) {
    var container = document.getElementById('notes-list');
    document.getElementById('notes-count').textContent = list.length + ' note(s)';
    container.innerHTML = '';
    if (!list.length) {
      container.appendChild(emptyState('No working notes recorded yet for the current session.'));
      return;
    }
    var sorted = list.slice().sort(function (a, b) {
      return (b.timestamp || '').localeCompare(a.timestamp || '');
    });
    sorted.forEach(function (n) {
      var card = recordCard(
        n.note_id,
        el('span', {}, [badge(n.activity_type)]),
        null,
        [
          el('div', { class: 'notes-timestamp' }, [formatTimestamp(n.timestamp)]),
          el('div', { class: 'kv-value' }, [n.text || '']),
          (n.related_thread || n.related_source || n.related_evidence)
            ? kv('Related', tagList([n.related_thread, n.related_source, n.related_evidence].filter(Boolean)))
            : null,
        ].filter(Boolean)
      );
      card.open = true;
      container.appendChild(card);
    });
  }

  // ---------------------------------------------------------------
  // Relationship Map
  //
  // Computed on the fly from the cross-reference fields already present
  // on Evidence, Chronology, Contradictions, Open Questions, and Threads
  // (spec section 14 "Relationship Map" / section 31 "Relationship").
  // There is no separate data/relationships.json - this view is a
  // derived index, not a new source of truth.
  // ---------------------------------------------------------------

  function nodeKey(type, id) {
    return type + ':' + id;
  }

  function buildRelationshipEdges(evidence, chronology, contradictions, questions, threads) {
    var edges = [];
    function addEdge(aType, aId, bType, bId, relation) {
      if (!aId || !bId) return;
      edges.push({ a: { type: aType, id: aId }, b: { type: bType, id: bId }, relation: relation });
    }

    evidence.forEach(function (e) {
      (e.relationships || []).forEach(function (id) { addEdge('Evidence', e.evidence_id, 'Evidence', id, 'related to'); });
      (e.chronology_links || []).forEach(function (id) { addEdge('Evidence', e.evidence_id, 'Chronology', id, 'supports'); });
      (e.contradiction_links || []).forEach(function (id) { addEdge('Evidence', e.evidence_id, 'Contradiction', id, 'involved in'); });
      (e.open_question_links || []).forEach(function (id) { addEdge('Evidence', e.evidence_id, 'Question', id, 'involved in'); });
    });
    chronology.forEach(function (c) {
      (c.supporting_evidence || []).forEach(function (id) { addEdge('Chronology', c.chronology_id, 'Evidence', id, 'supported by'); });
    });
    contradictions.forEach(function (c) {
      (c.supporting_evidence || []).forEach(function (id) { addEdge('Contradiction', c.contradiction_id, 'Evidence', id, 'supported by'); });
      (c.opposing_evidence || []).forEach(function (id) { addEdge('Contradiction', c.contradiction_id, 'Evidence', id, 'opposed by'); });
      (c.resolution_evidence || []).forEach(function (id) { addEdge('Contradiction', c.contradiction_id, 'Evidence', id, 'resolved by'); });
    });
    questions.forEach(function (q) {
      (q.evidence_creating_question || []).forEach(function (id) { addEdge('Question', q.question_id, 'Evidence', id, 'raised by'); });
      (q.resolution_evidence || []).forEach(function (id) { addEdge('Question', q.question_id, 'Evidence', id, 'resolved by'); });
    });
    threads.forEach(function (t) {
      (t.supporting_evidence || []).forEach(function (id) { addEdge('Thread', t.thread_id, 'Evidence', id, 'supported by'); });
      (t.dependencies || []).forEach(function (id) { addEdge('Thread', t.thread_id, 'Thread', id, 'depends on'); });
    });

    return edges;
  }

  function buildNodeLabels(evidence, chronology, contradictions, questions, threads) {
    var labels = {};
    evidence.forEach(function (e) { labels[nodeKey('Evidence', e.evidence_id)] = e.source_title || e.evidence_id; });
    chronology.forEach(function (c) { labels[nodeKey('Chronology', c.chronology_id)] = c.event_description || c.chronology_id; });
    contradictions.forEach(function (c) { labels[nodeKey('Contradiction', c.contradiction_id)] = c.description || c.contradiction_id; });
    questions.forEach(function (q) { labels[nodeKey('Question', q.question_id)] = q.question || q.question_id; });
    threads.forEach(function (t) { labels[nodeKey('Thread', t.thread_id)] = t.name || t.thread_id; });
    return labels;
  }

  function buildAdjacency(edges, labels) {
    var adjacency = {};
    var seen = new Set();

    function labelFor(node) {
      var key = nodeKey(node.type, node.id);
      return node.id + (labels[key] ? ' — ' + labels[key] : '');
    }

    function push(ownerNode, otherNode, relation) {
      var ownerKey = nodeKey(ownerNode.type, ownerNode.id);
      var dedupeKey = ownerKey + '|' + relation + '|' + nodeKey(otherNode.type, otherNode.id);
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);
      if (!adjacency[ownerKey]) adjacency[ownerKey] = { type: ownerNode.type, id: ownerNode.id, links: [] };
      adjacency[ownerKey].links.push({
        targetId: otherNode.id,
        label: relation + ' → ' + otherNode.type + ' ' + labelFor(otherNode),
      });
    }

    edges.forEach(function (edge) {
      push(edge.a, edge.b, edge.relation);
      push(edge.b, edge.a, edge.relation);
    });

    return adjacency;
  }

  function renderRelationshipStats(evidence, chronology, contradictions, questions, threads, edgeCount) {
    var container = document.getElementById('relationship-stats');
    if (!container) return;
    container.innerHTML = '';
    [
      ['Threads', threads.length],
      ['Evidence', evidence.length],
      ['Chronology', chronology.length],
      ['Open questions', questions.length],
      ['Contradictions', contradictions.length],
      ['Edges traced', edgeCount],
    ].forEach(function (pair) {
      container.appendChild(el('div', { class: 'rel-stat' }, [
        el('span', { class: 'rel-stat-value' }, [String(pair[1])]),
        el('span', { class: 'rel-stat-label' }, [pair[0]]),
      ]));
    });
  }

  function renderRelationshipMap(evidence, chronology, contradictions, questions, threads) {
    var container = document.getElementById('relationships-list');
    container.innerHTML = '';

    var edges = buildRelationshipEdges(evidence, chronology, contradictions, questions, threads);
    var labels = buildNodeLabels(evidence, chronology, contradictions, questions, threads);
    var adjacency = buildAdjacency(edges, labels);
    var nodeKeys = Object.keys(adjacency).sort();

    renderRelationshipStats(evidence, chronology, contradictions, questions, threads, edges.length);

    document.getElementById('relationships-count').textContent =
      nodeKeys.length + ' linked record(s), ' + edges.length + ' relationship(s)';

    if (!nodeKeys.length) {
      container.appendChild(emptyState('No relationships recorded yet. Once evidence is linked to chronology entries, contradictions, open questions, or threads, that network will appear here automatically.'));
      return;
    }

    nodeKeys.forEach(function (key) {
      var node = adjacency[key];
      var title = node.type + ' ' + node.id + (labels[key] ? ' — ' + labels[key] : '');
      var linksWrap = el('div', { class: 'tag-list' });
      node.links.forEach(function (link) {
        linksWrap.appendChild(linkedTag(link.targetId, link.label));
      });
      // No stable id passed here (relationship-map nodes reuse the same
      // EV-/CHR-/... ids as their home-section records) - this derived
      // view is a link *source*, not a navigation target itself.
      var card = recordCard(
        null,
        el('span', {}, [title]),
        node.links.length + ' link(s)',
        [linksWrap]
      );
      container.appendChild(card);
    });
  }

  // ---------------------------------------------------------------
  // Relationship Map - Mermaid diagrams
  //
  // Same edges/labels as renderRelationshipMap above, rendered as one
  // Mermaid flowchart per Investigation Thread instead of a link list.
  // Mirrors scripts/generate-relationship-map.js's diagram logic exactly
  // (that script mirrors this file, not the other way around - this is
  // the live, always-current version; the generated Markdown file is a
  // static snapshot for readers browsing the repository on GitHub).
  // ---------------------------------------------------------------

  var MERMAID_TYPE_PREFIX = { Evidence: 'EVID', Chronology: 'CHRO', Contradiction: 'CTRD', Question: 'QUES', Thread: 'THRD' };

  function mermaidId(type, id) {
    return MERMAID_TYPE_PREFIX[type] + '_' + String(id).replace(/[^A-Za-z0-9]/g, '_');
  }

  function escapeMermaidLabel(text) {
    return String(text).replace(/"/g, "'").replace(/\n/g, ' ').slice(0, 90);
  }

  function mermaidNodeLine(type, id, labels) {
    var key = nodeKey(type, id);
    var label = labels[key] ? id + ': ' + escapeMermaidLabel(labels[key]) : id;
    var shape = type === 'Thread' ? ['((', '))'] : type === 'Question' ? ['{{', '}}'] : type === 'Contradiction' ? ['[/', '/]'] : ['[', ']'];
    return '  ' + mermaidId(type, id) + shape[0] + '"' + label + '"' + shape[1];
  }

  function mermaidEdgeLine(edge) {
    return '  ' + mermaidId(edge.a.type, edge.a.id) + ' -- "' + edge.relation + '" --> ' + mermaidId(edge.b.type, edge.b.id);
  }

  function buildThreadDiagram(thread, edges, labels) {
    var nodeSet = new Map();
    var edgeLines = [];
    var edgeSeen = new Set();

    function addNode(type, id) {
      var key = nodeKey(type, id);
      if (!nodeSet.has(key)) nodeSet.set(key, { type: type, id: id });
    }
    function addEdgeLine(edge) {
      var dedupe = nodeKey(edge.a.type, edge.a.id) + '|' + edge.relation + '|' + nodeKey(edge.b.type, edge.b.id);
      if (edgeSeen.has(dedupe)) return;
      edgeSeen.add(dedupe);
      edgeLines.push(mermaidEdgeLine(edge));
    }

    addNode('Thread', thread.thread_id);
    var evidenceIds = new Set(thread.supporting_evidence || []);
    evidenceIds.forEach(function (id) { addNode('Evidence', id); });

    edges.forEach(function (edge) {
      if (edge.a.type === 'Thread' && edge.a.id === thread.thread_id && edge.b.type === 'Evidence' && evidenceIds.has(edge.b.id)) {
        addEdgeLine(edge);
      }
    });

    edges.forEach(function (edge) {
      if (edge.a.type === 'Evidence' && evidenceIds.has(edge.a.id) && ['Chronology', 'Contradiction', 'Question'].indexOf(edge.b.type) !== -1) {
        addNode(edge.b.type, edge.b.id);
        addEdgeLine(edge);
      }
    });

    if (nodeSet.size <= 1) return null;

    var lines = ['flowchart LR'];
    nodeSet.forEach(function (node) { lines.push(mermaidNodeLine(node.type, node.id, labels)); });
    lines = lines.concat(edgeLines);
    return lines.join('\n');
  }

  function buildThreadDependencyDiagram(threads, edges, labels) {
    var depEdges = edges.filter(function (e) { return e.a.type === 'Thread' && e.b.type === 'Thread'; });
    if (!depEdges.length) return null;
    var nodeSet = new Map();
    depEdges.forEach(function (e) {
      nodeSet.set(nodeKey(e.a.type, e.a.id), e.a);
      nodeSet.set(nodeKey(e.b.type, e.b.id), e.b);
    });
    var lines = ['flowchart LR'];
    nodeSet.forEach(function (node) { lines.push(mermaidNodeLine(node.type, node.id, labels)); });
    depEdges.forEach(function (e) { lines.push(mermaidEdgeLine(e)); });
    return lines.join('\n');
  }

  function diagramCard(titleNode, subtitleNode, definition, emptyMessage) {
    var body = definition
      ? [el('div', { class: 'diagram-plate' }, [el('pre', { class: 'mermaid' }, [definition])])]
      : [emptyState(emptyMessage)];
    return recordCard(null, titleNode, subtitleNode, body);
  }

  var mermaidReady = null;
  function loadMermaid() {
    if (!mermaidReady) {
      mermaidReady = import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs').then(function (mod) {
        var mermaid = mod.default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default',
        });
        return mermaid;
      });
    }
    return mermaidReady;
  }

  function renderRelationshipDiagrams(evidence, chronology, contradictions, questions, threads) {
    var container = document.getElementById('relationship-diagrams');
    if (!container) return;
    container.innerHTML = '';

    var edges = buildRelationshipEdges(evidence, chronology, contradictions, questions, threads);
    var labels = buildNodeLabels(evidence, chronology, contradictions, questions, threads);

    if (!threads.length) {
      container.appendChild(emptyState('No investigation threads defined yet.'));
      return;
    }

    var depDiagram = buildThreadDependencyDiagram(threads, edges, labels);
    if (depDiagram) {
      container.appendChild(diagramCard(
        el('span', {}, ['Thread dependencies']),
        null,
        depDiagram,
        null
      ));
    }

    threads.forEach(function (t) {
      var diagram = buildThreadDiagram(t, edges, labels);
      var linkedCount = (t.supporting_evidence || []).length;
      container.appendChild(diagramCard(
        el('span', {}, [idTag(t.thread_id), ' — ', t.name || '']),
        el('span', { class: 'rel-exhibit-meta' }, [
          badge(t.status),
          linkedCount + ' exhibit' + (linkedCount === 1 ? '' : 's') + ' linked',
        ]),
        diagram,
        'No linked evidence recorded yet for this thread.'
      ));
    });

    container.appendChild(el('div', { class: 'rel-legend' }, [
      el('span', { class: 'rel-legend-item' }, [el('span', { class: 'rel-legend-shape circle' }, []), 'Thread']),
      el('span', { class: 'rel-legend-item' }, [el('span', { class: 'rel-legend-shape' }, []), 'Evidence / Chronology']),
      el('span', { class: 'rel-legend-item' }, [el('span', { class: 'rel-legend-shape diamond' }, []), 'Open question']),
      el('span', { class: 'rel-legend-item' }, [el('span', { class: 'rel-legend-shape slant' }, []), 'Contradiction']),
    ]));

    loadMermaid().then(function (mermaid) {
      return mermaid.run({ querySelector: '#relationship-diagrams pre.mermaid' });
    }).catch(function (err) {
      container.insertBefore(emptyState('Diagrams could not be rendered (' + err.message + ').'), container.firstChild);
    });
  }

  // ---------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------

  var VALID_SECTIONS = ['resume', 'overview', 'evidence', 'chronology', 'sources', 'contradictions', 'questions', 'actions', 'threads', 'decisions', 'searchlog', 'relationships', 'notes'];

  // recordId, if given, opens and scrolls to that record's card within the
  // section (a real deep link, e.g. #evidence/EV-0011). opts.replace uses
  // history.replaceState instead of pushState - used only when responding
  // to a URL that's already current (initial load, popstate) so we don't
  // stack a duplicate history entry; user-initiated clicks always push, so
  // browser back/forward moves through the pages actually visited.
  function showSection(name, recordId, opts) {
    opts = opts || {};
    document.querySelectorAll('.workspace-section').forEach(function (section) {
      section.hidden = section.id !== 'section-' + name;
    });
    document.querySelectorAll('.nav-link').forEach(function (link) {
      link.classList.toggle('active', link.dataset.section === name);
    });
    closeDrawer();
    var hash = '#' + name + (recordId ? '/' + recordId : '');
    try {
      if (opts.replace) history.replaceState(null, '', hash);
      else history.pushState(null, '', hash);
    } catch (e) { /* ignore */ }
    if (recordId) {
      openRecord(recordId);
    } else {
      window.scrollTo(0, 0);
    }
  }

  function openDrawer() {
    document.getElementById('nav-drawer').hidden = false;
    document.getElementById('nav-scrim').hidden = false;
    document.getElementById('menu-toggle').setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    document.getElementById('nav-drawer').hidden = true;
    document.getElementById('nav-scrim').hidden = true;
    document.getElementById('menu-toggle').setAttribute('aria-expanded', 'false');
  }

  // Parses "#section/RECORD-ID" (the record part is optional) into its
  // two pieces, falling back to the Resume section for anything unknown.
  function parseHash() {
    var raw = (window.location.hash || '').replace('#', '');
    var parts = raw.split('/');
    var section = VALID_SECTIONS.indexOf(parts[0]) !== -1 ? parts[0] : 'resume';
    return { section: section, recordId: parts[1] || null };
  }

  // Set once at startup from the incoming URL; consumed after the initial
  // data load finishes rendering, since a record's card doesn't exist in
  // the DOM (openRecord has nothing to find/scroll to) until then.
  var pendingRecordId = null;

  function initNav() {
    document.getElementById('menu-toggle').addEventListener('click', function () {
      var isOpen = !document.getElementById('nav-drawer').hidden;
      if (isOpen) closeDrawer(); else openDrawer();
    });
    document.getElementById('nav-scrim').addEventListener('click', closeDrawer);
    document.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        showSection(link.dataset.section);
      });
    });

    window.addEventListener('popstate', function () {
      var parsed = parseHash();
      showSection(parsed.section, parsed.recordId, { replace: true });
    });

    var initial = parseHash();
    pendingRecordId = initial.recordId;
    // recordId is passed here only so the URL hash is set correctly right
    // away; openRecord silently no-ops since no record cards exist in the
    // DOM yet (data hasn't loaded). The bootstrap's post-render step below
    // calls openRecord(pendingRecordId) again once they do.
    showSection(initial.section, initial.recordId, { replace: true });
  }

  // ---------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------

  function fetchJson(path) {
    return fetch(path).then(function (res) {
      if (!res.ok) throw new Error(path + ' - HTTP ' + res.status);
      return res.json();
    });
  }

  function showLoadError(err) {
    var box = document.getElementById('load-error');
    box.hidden = false;
    box.textContent = 'Could not load investigation data (' + err.message + '). ' +
      'This workspace must be served over HTTP, not opened directly as a file. ' +
      'From the repository root run a static server, e.g. "npx serve ." or ' +
      '"python -m http.server", then open it in your browser.';
  }

  function refreshNotes() {
    fetchJson(DATA_PATHS.notes + '?t=' + Date.now()).then(function (notes) {
      renderNotes(notes);
      setFilterable('notes-list', function (node) { return node.textContent; });
      var badge = document.getElementById('notes-live-badge');
      if (badge) badge.title = 'Last refreshed ' + new Date().toLocaleTimeString();
    }).catch(function () { /* keep showing the last successful fetch */ });
  }

  initNav();

  Promise.all([
    fetchJson(DATA_PATHS.case),
    fetchJson(DATA_PATHS.evidence),
    fetchJson(DATA_PATHS.sources),
    fetchJson(DATA_PATHS.chronology),
    fetchJson(DATA_PATHS.contradictions),
    fetchJson(DATA_PATHS.questions),
    fetchJson(DATA_PATHS.threads),
    fetchJson(DATA_PATHS.automationLog),
    fetchJson(DATA_PATHS.notes),
    fetchJson(DATA_PATHS.decisions),
    fetchJson(DATA_PATHS.searchLog),
  ]).then(function (results) {
    var caseDef = results[0];
    var evidence = results[1];
    var sources = results[2];
    var chronology = results[3];
    var contradictions = results[4];
    var questions = results[5];
    var threads = results[6];
    var automationLog = results[7];
    var notes = results[8];
    var decisions = results[9];
    var searchLog = results[10];

    renderResume(caseDef, evidence, chronology, contradictions, questions, threads, automationLog, decisions);
    renderCase(caseDef);
    renderEvidence(evidence);
    renderSources(sources);
    renderChronology(chronology);
    renderContradictions(contradictions);
    renderQuestions(questions);
    renderActions(questions, sources);
    renderThreads(threads);
    renderDecisions(decisions);
    renderSearchLog(searchLog);
    renderRelationshipMap(evidence, chronology, contradictions, questions, threads);
    renderRelationshipDiagrams(evidence, chronology, contradictions, questions, threads);
    renderNotes(notes);

    setFilterable('evidence-list', function (node) { return node.textContent; });
    setFilterable('chronology-list', function (node) { return node.textContent; });
    setFilterable('sources-list', function (node) { return node.textContent; });
    setFilterable('contradictions-list', function (node) { return node.textContent; });
    setFilterable('questions-list', function (node) { return node.textContent; });
    setFilterable('actions-questions-list', function (node) { return node.textContent; });
    setFilterable('actions-blocked-list', function (node) { return node.textContent; });
    setFilterable('threads-list', function (node) { return node.textContent; });
    setFilterable('decisions-list', function (node) { return node.textContent; });
    setFilterable('searchlog-list', function (node) { return node.textContent; });
    setFilterable('relationships-list', function (node) { return node.textContent; });
    setFilterable('notes-list', function (node) { return node.textContent; });

    document.getElementById('footer-versions').textContent =
      'Repository v' + caseDef.repository_version + ' · ' + caseDef.specification_version;
    document.getElementById('footer-loaded').textContent =
      'Loaded ' + new Date().toLocaleString();

    // Now that every section's record cards exist in the DOM, fulfil a
    // deep link from the page's initial URL (e.g. #evidence/EV-0011),
    // which initNav() couldn't do earlier since there was nothing yet to
    // scroll to or open.
    if (pendingRecordId) {
      openRecord(pendingRecordId);
      pendingRecordId = null;
    }

    // Investigation Notes poll for live updates while this static page stays open -
    // there is no server push, so a plain periodic re-fetch is the honest equivalent
    // (spec section 32: compliance is about preserving behaviour, not implementation).
    setInterval(refreshNotes, NOTES_REFRESH_INTERVAL_MS);
  }).catch(function (err) {
    showLoadError(err);
  });
})();
