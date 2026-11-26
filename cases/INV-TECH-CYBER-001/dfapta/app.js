(() => {
  'use strict';
  const node = (tag, text, className) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = String(text); if (className) el.className = className; return el; };
  const target = id => document.getElementById(id);
  const add = (parent, tag, text, className) => { const el = node(tag, text, className); parent.appendChild(el); return el; };
  const evidenceLink = id => { const a = node('a', id); a.href = '../dfapti/#evidence/' + encodeURIComponent(id); return a; };
  const sourceLink = value => { try { const url = new URL(value); if (!['https:', 'http:'].includes(url.protocol)) return null; const a = node('a', 'Open source'); a.href = url.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; } catch { return null; } };
  const digest = async bytes => { if (!globalThis.crypto?.subtle) return null; const result = await crypto.subtle.digest('SHA-256', bytes); return Array.from(new Uint8Array(result), n => n.toString(16).padStart(2, '0')).join(''); };

  function render(stage, evidence, evidenceHash) {
    if (!Array.isArray(stage.paths) || !stage.coverage || !Array.isArray(evidence)) throw new Error('The records are not in the expected format.');
    const evidenceById = new Map(evidence.map(item => [item.evidence_id, item]));
    const recordedIds = Object.keys(stage.coverage);
    const newer = evidence.filter(item => !Object.prototype.hasOwnProperty.call(stage.coverage, item.evidence_id));
    const absent = recordedIds.filter(id => !evidenceById.has(id));
    const state = target('state');
    if (evidenceHash && evidenceHash !== stage.basis.evidence_register_sha256) state.textContent = 'The live register bytes differ from this pass’s checkpoint. This can reflect changed evidence or different line endings. Earlier analysis remains visible; changed evidence needs a further pass.';
    else if (!evidenceHash) state.textContent = 'The records loaded. This browser could not verify the evidence checkpoint hash.';
    else state.textContent = 'The current evidence register matches the checkpoint used for this pass.';
    const basis = target('basis');
    add(basis, 'p', stage.evidence_basis_note);
    add(basis, 'p', `${stage.paths.length} distinct paths · ${recordedIds.filter(id => stage.coverage[id].length).length} of ${recordedIds.length} checkpoint evidence identifiers cited · ${stage.basis.source_count} source records at this checkpoint.`);
    add(basis, 'p', `At the checkpoint, ${stage.basis.verification_states.Verified || 0} evidence entries were labelled verified and ${stage.basis.verification_states['Requires Verification'] || 0} required verification. The labels concern the relevant record and its stated limits.`, 'meta');
    add(basis, 'p', stage.basis.preserved_reference_note, 'meta');
    add(basis, 'p', `Evidence register SHA-256 of committed Git-blob bytes: ${stage.basis.evidence_register_sha256}`, 'meta');
    if (newer.length) add(basis, 'p', `${newer.length} evidence record(s) are newer than this checkpoint and are listed below for a later analysis pass.`, 'gap');
    if (absent.length) add(basis, 'p', `The current register does not contain ${absent.length} checkpoint identifier(s): ${absent.join(', ')}. This is a discrepancy to investigate.`, 'gap');
    target('paths-count').textContent = `${stage.paths.length} paths`;
    const list = target('paths-list');
    const cards = stage.paths.map(path => {
      const card = node('article', undefined, 'path'); card.id = path.id;
      add(card, 'div', path.id, 'path-id'); add(card, 'h3', path.title);
      add(card, 'h4', 'What the sources report'); add(card, 'p', path.source_record);
      add(card, 'h4', 'Determination: what the records show together');
      path.determinations.forEach(([id, finding]) => { add(card, 'p', `${id} — ${finding}`); });
      add(card, 'h4', 'Mechanism');
      path.mechanisms.forEach(([name, status, explanation]) => { add(card, 'p', `${name} — ${explanation}`); add(card, 'p', status, 'meta'); });
      add(card, 'h4', 'Limits and what is not established'); add(card, 'p', path.boundary);
      const anchors = node('div', undefined, 'anchors'); anchors.setAttribute('aria-label', 'Supporting evidence');
      path.anchors.forEach(id => anchors.appendChild(evidenceLink(id))); card.appendChild(anchors); list.appendChild(card);
      return {card, text: `${path.id} ${path.title} ${path.source_record} ${path.analysis} ${JSON.stringify(path.mechanisms)} ${path.boundary} ${path.anchors.join(' ')}`.toLocaleLowerCase()};
    });
    target('path-search').addEventListener('input', event => { const q = event.target.value.trim().toLocaleLowerCase(); cards.forEach(item => { item.card.hidden = !!q && !item.text.includes(q); }); });
    const observations = target('cross-path-list');
    (stage.cross_path_observations || []).forEach(observation => {
      const card = node('article', undefined, 'path'); card.id = observation.id;
      add(card, 'div', observation.id, 'path-id'); add(card, 'h3', observation.title);
      add(card, 'p', observation.analysis); add(card, 'h4', 'Limits'); add(card, 'p', observation.boundary);
      const links = node('div', undefined, 'anchors'); links.setAttribute('aria-label', 'Related analysis paths');
      observation.paths.forEach(id => { const link = node('a', id); link.href = '#' + encodeURIComponent(id); links.appendChild(link); });
      card.appendChild(links); observations.appendChild(card);
    });
    target('coverage-count').textContent = `${recordedIds.length} checkpoint records · ${newer.length} later records`;
    const coverageList = target('coverage-list');
    const renderItem = (id, refs, current) => {
      const item = evidenceById.get(id); const details = node('details', undefined, 'coverage-item');
      const summary = node('summary', `${id} — ${item?.source_title || 'Record missing from current register'}`); details.appendChild(summary);
      if (!item) { add(details, 'p', 'This checkpoint identifier is absent from the current register; consult preserved records before relying on it.', 'gap'); return details; }
      add(details, 'p', `Verification: ${item.verification_state || 'Not stated'} · Preservation classification: ${item.classification || 'Not stated'}`, 'meta');
      add(details, 'p', `Analysis paths: ${refs.length ? refs.join(', ') : current ? 'Not yet assessed in this checkpoint' : 'No path reference at this checkpoint'}`, 'meta');
      add(details, 'p', item.evidence_description || 'No description recorded.');
      add(details, 'p', `Investigation relevance and limits: ${item.investigation_relevance || 'Not recorded.'}`);
      add(details, 'p', `Preserved case file: ${item.preserved_file_reference || 'No preserved case file referenced'}.`, 'meta');
      const links = node('p'); links.appendChild(evidenceLink(id)); const source = sourceLink(item.source_location); if (source) { links.append(' · '); links.appendChild(source); } details.appendChild(links);
      return details;
    };
    recordedIds.forEach(id => coverageList.appendChild(renderItem(id, stage.coverage[id], false)));
    if (newer.length) { add(coverageList, 'h3', 'Evidence added since this checkpoint'); newer.forEach(item => coverageList.appendChild(renderItem(item.evidence_id, [], true))); }
  }

  Promise.all([fetch('analysis.json', {cache:'no-store'}), fetch('../data/evidence_register.json', {cache:'no-store'})])
    .then(async ([analysisResponse, evidenceResponse]) => {
      if (!analysisResponse.ok || !evidenceResponse.ok) throw new Error('The analysis or evidence register could not be loaded.');
      const [stage, bytes] = await Promise.all([analysisResponse.json(), evidenceResponse.arrayBuffer()]);
      return render(stage, JSON.parse(new TextDecoder().decode(bytes)), await digest(bytes));
    }).catch(error => { target('state').textContent = `Analysis unavailable: ${error.message} Please reload or consult the evidence workspace.`; });
})();
