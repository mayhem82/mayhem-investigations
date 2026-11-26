(() => {
  'use strict';
  const el = (tag, value, cls) => { const n = document.createElement(tag); if (value !== undefined) n.textContent = String(value); if (cls) n.className = cls; return n; };
  const add = (parent, tag, value, cls) => { const n = el(tag, value, cls); parent.appendChild(n); return n; };
  const byId = id => document.getElementById(id);
  const link = (label, href) => { const a = el('a', label); a.href = href; return a; };
  async function digest(bytes) {
    if (!globalThis.crypto?.subtle) return null;
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join('');
  }
  async function main() {
    const [atlasResponse, analysisResponse] = await Promise.all([
      fetch('patterns.json', {cache:'no-store'}), fetch('../dfapta/analysis.json', {cache:'no-store'})
    ]);
    if (!atlasResponse.ok || !analysisResponse.ok) throw new Error('The atlas or source analysis could not be loaded.');
    const [atlas, bytes] = await Promise.all([atlasResponse.json(), analysisResponse.arrayBuffer()]);
    if (!Array.isArray(atlas.patterns)) throw new Error('The atlas has an unexpected format.');
    const analysis = JSON.parse(new TextDecoder().decode(bytes));
    const hash = await digest(bytes);
    const pathIds = new Set((analysis.paths || []).map(p => p.id));
    const missing = [...new Set(atlas.patterns.flatMap(p => p.connections.map(c => c.path)).filter(id => !pathIds.has(id)))];
    let message = hash === atlas.analysis_sha256
      ? 'The current analysis matches the reading used for this atlas.'
      : hash ? 'The source analysis has changed since this atlas reading. Earlier connections remain visible and need review against the newer analysis.'
      : 'The atlas loaded, but this browser could not check the analysis hash.';
    if (missing.length) message += ` The current analysis is missing referenced paths: ${missing.join(', ')}.`;
    byId('state').textContent = `${message} Reading recorded ${atlas.created_at_utc}.`;
    byId('count').textContent = `${atlas.patterns.length} patterns`;
    const cards = atlas.patterns.map(pattern => {
      const card = el('article', undefined, 'path'); card.id = pattern.id;
      add(card, 'div', pattern.id, 'path-id'); add(card, 'h3', pattern.title);
      add(card, 'p', pattern.finding);
      for (const correction of pattern.corrections || []) { add(card, 'h4', 'Dated correction · ' + correction.date); add(card, 'p', correction.text, 'gap'); }
      add(card, 'h4', 'Connections and their evidence');
      for (const connection of pattern.connections) {
        const item = el('div', undefined, 'coverage-item');
        add(item, 'p', connection.observation);
        const refs = el('div', undefined, 'anchors'); refs.setAttribute('aria-label', 'Analysis and evidence references');
        refs.appendChild(link(connection.path, '../dfapta/#' + encodeURIComponent(connection.path)));
        for (const id of connection.evidence) refs.appendChild(link(id, '../dfapti/#evidence/' + encodeURIComponent(id)));
        item.appendChild(refs); card.appendChild(item);
      }
      add(card, 'h4', 'What this does not establish'); add(card, 'p', pattern.boundary);
      byId('pattern-list').appendChild(card);
      return {card, text: JSON.stringify(pattern).toLocaleLowerCase()};
    });
    byId('search').addEventListener('input', event => {
      const value = event.target.value.trim().toLocaleLowerCase();
      cards.forEach(item => { item.card.hidden = !!value && !item.text.includes(value); });
    });
  }
  main().catch(error => { byId('state').textContent = `Atlas unavailable: ${error.message} Please reload or consult the analysis workspace.`; });
})();
