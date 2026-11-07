import { minimumForLecture, defaultStudyMinimum } from './study-targets.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync('library-data.js','utf8'),ctx);
const data=ctx.window.LIBRARY;
const findings=[];
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const questions=new Map(),cards=new Map();
const rows=data.videos.map(v=>{
  const qs=v.questions||[],fc=data.flashcards.filter(c=>c.lectureId===v.id);
  for(const q of qs){
    const key=norm(q.prompt);
    if(questions.has(key))findings.push({type:'duplicate-question',id:q.id,other:questions.get(key)});else questions.set(key,q.id);
    if(q.options?.length!==5||new Set(q.options.map(norm)).size!==5||!q.options.includes(q.answer))findings.push({type:'invalid-options',id:q.id});
    if(!q.references?.length)findings.push({type:'missing-references',id:q.id});
    if(q.options?.some(o=>!q.distractorExplanations?.[o]))findings.push({type:'missing-option-rationale',id:q.id});
    if(q.prompt.split(/\s+/).length<30)findings.push({type:'short-vignette-review',id:q.id});
  }
  for(const c of fc){const key=norm(c.front)+'|'+norm(c.back);if(cards.has(key))findings.push({type:'duplicate-card',id:c.id,other:cards.get(key)});else cards.set(key,c.id);if(!c.explanation?.trim())findings.push({type:'missing-card-explanation',id:c.id});}
  return {id:v.id,title:v.title,questions:qs.length,flashcards:fc.length,target:minimumForLecture(v.id),minimumMet:qs.length>=minimumForLecture(v.id)&&fc.length>=minimumForLecture(v.id),source:v.noteStatus};
});
const report={targetPerLecture:defaultStudyMinimum,lectures:rows.length,minimumQuestions:rows.reduce((n,r)=>n+r.target,0),minimumFlashcards:rows.reduce((n,r)=>n+r.target,0),questions:data.videos.reduce((n,v)=>n+v.questions.length,0),flashcards:data.flashcards.length,lecturesMeetingMinimum:rows.filter(r=>r.minimumMet).length,findings,coverage:rows};
fs.writeFileSync('content-quality-audit.json',JSON.stringify(report,null,2));
console.log({lectures:report.lectures,questions:report.questions,flashcards:report.flashcards,lecturesMeetingMinimum:report.lecturesMeetingMinimum,findings:findings.length});
if(process.argv.includes('--strict')&&(rows.some(r=>!r.minimumMet)||findings.length))process.exitCode=1;
