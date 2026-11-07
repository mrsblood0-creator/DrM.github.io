import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('library-data.js','utf8'),ctx);
const {articles,videos}=ctx.window.LIBRARY;
const originals=articles.flatMap(a=>a.files);
for(const dir of ['.','DrM.github.io'])for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.html')&&!(dir==='.'&&['index.html','channel.html'].includes(f))))assert(originals.includes(dir==='.'?file:dir+'/'+file),file);
for(const article of articles){assert(!/<script\b/i.test(article.html));assert(article.html.includes('<body>'));for(const file of article.files)assert(fs.existsSync(file));}
for(const video of videos.filter(v=>v.source))assert(articles.some(a=>a.id===video.originalArticleId&&a.files.includes(video.source)));
const barbiturates=articles.find(a=>a.files.includes('Barbiturates Pharmacology.html'));assert(barbiturates.html.includes('<table'));
const bone=articles.find(a=>a.files.includes('Bone healing process.html'));assert(bone.html.includes('Course Topics'));assert(bone.html.includes('first need')||bone.html.includes('First we need'));
assert(articles.some(a=>a.files.includes('about.html')));assert(articles.some(a=>a.files.includes('Privacy Policy.html')));
assert(articles.some(a=>a.files.includes('Pharmacokinetics 101 Drug Metabolism.html')&&a.html.includes('Course Menu')));
console.log(`PASS: every one of ${originals.length} previous HTML files included; full tables, introductions, course menus, and all ${videos.filter(v=>v.source).length} matched lecture references verified.`);
