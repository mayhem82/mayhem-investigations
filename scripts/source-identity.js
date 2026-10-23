'use strict';

function normalizeUrl(value) {
  const text = String(value || '').trim();
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol)) return text;
    return url.href;
  } catch { return text; }
}

module.exports = { normalizeUrl };
