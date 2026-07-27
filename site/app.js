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
  };

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

  function tagList(ids) {
    if (!ids || !ids.length) return el('span', { class: 'kv-value' }, ['None']);
    var wrap = el('div', { class: 'tag-list' });
    ids.forEach(function (id) {
      wrap.appendChild(el('span', { class: 'tag-chip' }, [id]));
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

  function recordCard(titleNode, subtitle, bodyRows) {
    var summary = el('summary', {}, [
      el('div', { class: 'record-title' }, [titleNode]),
      subtitle ? el('div', { class: 'record-sub' }, [subtitle]) : null,
    ]);
    var body = el('div', { class: 'record-body' }, bodyRows);
    return el('details', { class: 'record' }, [summary, body]);
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

  function renderCase(caseDef) {
    var target = document.getElementById('overview-content');
    target.innerHTML = '';
    if (!caseDef) {
      target.appendChild(emptyState('Case definition could not be loaded.'));
      return;
    }
    document.getElementById('header-case-id').textContent = caseDef.case_identifier || 'DFAPTI-BB-2026-00001';
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

  function renderChronology(list) {
    var container = document.getElementById('chronology-list');
    document.getElementById('chronology-count').textContent = list.length + ' entr' + (list.length === 1 ? 'y' : 'ies');
    container.innerHTML = '';
    if (!list.length) {
      container.appendChild(emptyState('The chronology is empty. No events have been confirmed yet.'));
      return;
    }
    list.forEach(function (c) {
      var card = recordCard(
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
          kv('Associated Thread', s.associated_thread),
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

  // ---------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------

  function showSection(name) {
    document.querySelectorAll('.workspace-section').forEach(function (section) {
      section.hidden = section.id !== 'section-' + name;
    });
    document.querySelectorAll('.nav-link').forEach(function (link) {
      link.classList.toggle('active', link.dataset.section === name);
    });
    closeDrawer();
    window.scrollTo(0, 0);
    try { history.replaceState(null, '', '#' + name); } catch (e) { /* ignore */ }
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

    var initial = (window.location.hash || '').replace('#', '');
    var valid = ['overview', 'evidence', 'chronology', 'sources', 'contradictions', 'questions', 'threads'];
    showSection(valid.indexOf(initial) !== -1 ? initial : 'overview');
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
      '"python -m http.server", then open /site/ in your browser.';
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
  ]).then(function (results) {
    var caseDef = results[0];
    var evidence = results[1];
    var sources = results[2];
    var chronology = results[3];
    var contradictions = results[4];
    var questions = results[5];
    var threads = results[6];

    renderCase(caseDef);
    renderEvidence(evidence);
    renderSources(sources);
    renderChronology(chronology);
    renderContradictions(contradictions);
    renderQuestions(questions);
    renderThreads(threads);

    setFilterable('evidence-list', function (node) { return node.textContent; });
    setFilterable('chronology-list', function (node) { return node.textContent; });
    setFilterable('sources-list', function (node) { return node.textContent; });
    setFilterable('contradictions-list', function (node) { return node.textContent; });
    setFilterable('questions-list', function (node) { return node.textContent; });
    setFilterable('threads-list', function (node) { return node.textContent; });

    document.getElementById('footer-versions').textContent =
      'Repository v' + caseDef.repository_version + ' · ' + caseDef.specification_version;
    document.getElementById('footer-loaded').textContent =
      'Loaded ' + new Date().toLocaleString();
  }).catch(function (err) {
    showLoadError(err);
  });
})();
