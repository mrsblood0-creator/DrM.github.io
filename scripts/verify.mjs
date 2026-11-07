import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const elements=new Map(),storage=new Map();
function element(s){if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:'',value:'',checked:false,hidden:false,addEventListener(t,f){this[t]=f},classList:{toggle(){}},setAttribute(){},focus(){}});return elements.get(s)}
for(const k of ['subject','course','pool'])element('#bank-'+k).value='all';
for(const [k,v] of [['count','10'],['mode','tutor'],['time','0']])element('#bank-'+k).value=v;
const document={querySelector:element,querySelectorAll:()=>[],addEventListener(){},activeElement:{tagName:'BODY'}};
const location={hash:''},window={scrollTo(){},addEventListener(){}};
const ctx=vm.createContext({document,location,window,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},console,URLSearchParams,setInterval(){},setTimeout(){},clearTimeout(){},DOMParser:class{parseFromString(html){return {querySelectorAll:()=>[],body:{innerHTML:html,querySelectorAll:()=>[]}}}}});
const run=s=>vm.runInContext(s,ctx);
run(fs.readFileSync('library-data.js','utf8'));const d=window.LIBRARY;
assert.equal(new Set(d.videos.map(v=>v.id)).size,d.videos.length);assert(!d.articles);
const catalog=JSON.parse(fs.readFileSync('channel-catalog.json','utf8'));assert.deepEqual([...d.videos.map(v=>v.id)].sort(),[...new Set([...catalog.videos.filter(v=>v.kind!=="shorts").map(v=>v.id),...JSON.parse(fs.readFileSync("content/additional-lectures.json")).map(v=>v.id)])].sort());
assert.equal(new Set(d.courses.flatMap(c=>Array.from(c.lectureIds))).size,d.videos.length);
assert.equal(d.videos.filter(v=>v.source).length,83);
for(const c of d.courses){assert.equal(new Set(c.lectureIds).size,c.lectureIds.length);for(const id of c.lectureIds)assert(d.videos.some(v=>v.id===id))}
for(const v of d.videos){assert(v.notesDisabled||v.notesHtml||v.notes.length);for(const q of v.questions){assert.equal(new Set(q.options).size,5);assert(q.options.includes(q.answer));assert(q.explanation)}}
run(fs.readFileSync('academy.js','utf8'));
assert(element('#lecture-results').textContent.startsWith(d.videos.length+' lectures'));
element('#lecture-search').value='amyloidosis';run('renderLibrary()');assert.match(element('#lecture-results').textContent,/1 lectures/);
for(const v of d.videos){location.hash='#lecture/'+v.id;run('route()');assert(element('#video-player').innerHTML.includes(v.id));assert.equal(element('#lecture-notes-panel').hidden,!!v.notesDisabled);if(v.notesDisabled)assert.equal(element('#lecture-notes').innerHTML,'');else assert(element('#lecture-notes').innerHTML.length>50)}
for(const c of d.courses){location.hash='#course/'+c.id;run('route()');assert(element('#curriculum').innerHTML.includes(c.lectureIds[0]))}
run('toggleLecture(V[0].id)');assert(storage.get('drm-saved'));
for(const v of d.videos){
 location.hash='#bank/'+v.id;run('route()');
 assert.equal(element('#bank-lecture').value,v.id);
 assert.equal(run('pool().length'),v.questions.length);
 assert(run('pool().every(q=>q.lectureId===location.hash.split("/")[1])'));
 assert(element('#bank-lecture-context').innerHTML.includes('#lecture/'+v.id));
 assert.equal(element('#bank-lecture-context').hidden,false);
}
element('#bank-lecture').value='all';
console.log('PASS: every lecture question deep link selects only that lecture.');
location.hash='#lecture/'+d.videos[0].id;run('route()');element('#personal-notes').value='Saved note';element('#personal-notes').oninput();run('route()');assert.equal(element('#personal-notes').value,'Saved note');
run('startSession(Q.slice(0,3),{all:true})');assert.equal(run('session.ids.length'),3);
run('session.ids.forEach(id=>session.answers[id]=qMap.get(id).answer);finishSession()');assert.equal(run('lastResult.score'),3);assert.equal(run('session'),null);
run('startSession(Q.slice(0,3),{all:true,mode:"exam"});finishSession()');assert.equal(run('lastResult.score'),0);assert.equal(run('pool().length'),run('Q.length'));
element('#bank-pool').value='incorrect';assert.equal(run('pool().length'),3);
element('#bank-time').value='10';run('startSession(Q.slice(0,2),{all:true});pauseSession()');assert(run('session.paused'));assert.equal(run('session.deadline'),null);run('resumeSession()');assert(run('session.deadline>Date.now()'));run('finishSession(true)');assert(run('lastResult.expired'));
const html=fs.readFileSync('index.html','utf8');assert(!html.includes('originals.js'));assert(!html.includes('id="quiz"'));assert(!html.includes('Original articles'));
console.log(`PASS: ${d.videos.length} video routes, 83 complete note imports, ${d.courses.length} courses, ${run('Q.length')} unique questions; search, bookmarks, personal notes, tutor/exam scoring, incorrect pool, pause/resume, and expiry.`);

for(const v of d.videos){assert(v.enriched);if(v.notesDisabled){assert(JSON.parse(fs.readFileSync('content/lecture-note-policy.json','utf8')).withoutNotes.includes(v.id));assert.equal(v.notesHtml,'');continue;}assert(v.notesHtml.includes('lecture-outline'));assert(!/video-frame-grid|concept-map|teaching-figure/.test(v.notesHtml));assert(v.notesHtml.includes('/#bank/'+v.id));assert(v.notesHtml.includes('/#flashcards/'+v.id));for(const m of v.notesHtml.matchAll(/data-scroll-note="([^"]+)"/g))assert(v.notesHtml.includes('id="'+m[1]+'"'));}console.log('PASS: source notes, outline targets and lecture-specific practice links.');
const corrupt={ 'drm-saved':'{}', 'drm-completed':'"invalid"', 'drm-q-saved':'7', 'drm-q-history':'[null,{}]', 'drm-q-session':'{"ids":[]}', 'drm-q-last-result':'{"results":{}}' };
const recovery=vm.createContext({...ctx,location:{hash:'#library'},localStorage:{getItem:k=>corrupt[k]??null,setItem(){}}});
assert.doesNotThrow(()=>vm.runInContext(fs.readFileSync('academy.js','utf8'),recovery));
assert.equal(vm.runInContext('session',recovery),null);
assert.equal(vm.runInContext('lastResult',recovery),null);
console.log('PASS: malformed saved progress cannot prevent the library from loading.');
