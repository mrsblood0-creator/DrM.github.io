import fs from 'node:fs';

// Keep archived source pages intact; apply explicit editorial corrections only
// when rendering the corresponding lecture's imported notes.
const corrections = JSON.parse(fs.readFileSync(new URL('../content/legacy-note-corrections.json', import.meta.url), 'utf8'));
export function correctLegacyNotes(id, html) {
  for (const [before, after] of corrections[id] || []) {
    if (!html.includes(before)) throw new Error(`Legacy correction no longer matches ${id}: ${before}`);
    html = html.replaceAll(before, after);
  }
  return html;
}
export const hasLegacyCorrections = id => Boolean(corrections[id]?.length);
