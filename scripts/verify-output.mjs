import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';

const context = { window: {} };
vm.runInNewContext(fs.readFileSync('dist/library-data.js', 'utf8'), context);
const data = context.window.LIBRARY;
const ids = new Set(data.videos.map(v => v.id));
assert.equal(ids.size, data.videos.length);
assert(data.videos.every(v => v.kind !== 'shorts'));
assert.equal(new Set(data.flashcards.map(c => c.id)).size, data.flashcards.length);
assert.equal(new Set(data.flashcards.map(c => c.lectureId)).size, ids.size);
for (const card of data.flashcards) {
  assert(ids.has(card.lectureId));
  assert(card.front?.trim() && card.back?.trim() && card.explanation?.trim());
}
const playlists = JSON.parse(fs.readFileSync('youtube-playlists.json', 'utf8'));
const list = Array.isArray(playlists) ? playlists : playlists.playlists;
for (const course of data.courses.filter(c => c.playlistUrl)) {
  const source = list.find(p => p.id === course.id);
  assert(source, 'Missing playlist source: ' + course.id);
  const sourceVideos = source.videos || source.lectureIds || source.videoIds;
  const expected = sourceVideos.map(v => typeof v === 'string' ? v : v.id || v.videoId).filter(id => ids.has(id));
  assert.deepEqual(Array.from(course.lectureIds), [...new Set(expected)], 'Playlist order: ' + course.title);
}
const htmlFiles = fs.readdirSync('dist', { recursive: true }).filter(f => f.endsWith('.html'));
let media = 0;
for (const file of htmlFiles) {
  const full = path.resolve('dist', file);
  const html = fs.readFileSync(full, 'utf8');
  assert(html.includes('rel="canonical"'), file + ': canonical missing');
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(https?:|data:|#|mailto:)/.test(url)) continue;
    const clean = decodeURIComponent(url.split(/[?#]/)[0]);
    let target = clean.startsWith('/') ? path.resolve('dist', '.' + clean) : path.resolve(path.dirname(full), clean);
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    assert(fs.existsSync(target), file + ': missing linked resource ' + url);
    media++;
  }
}
assert(fs.existsSync('dist/sitemap.xml') && fs.existsSync('dist/robots.txt'));
const result = { lectures: ids.size, courses: data.courses.length, questions: data.videos.reduce((n,v)=>n+v.questions.length,0), flashcards: data.flashcards.length, htmlPages: htmlFiles.length, checkedLocalLinks: media, sourceDeckLectures: data.videos.filter(v=>v.noteStatus==='Source presentation').length, videoReferenceLectures: data.videos.filter(v=>v.noteStatus==='Video frames + study guide').length };
fs.writeFileSync('verification-report.json', JSON.stringify(result, null, 2));
console.log('PASS: packaged pages, local links, card coverage, playlist order and Shorts exclusion.', result);
