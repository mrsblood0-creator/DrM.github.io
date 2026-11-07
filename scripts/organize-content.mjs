import fs from './legacy-source-fs.mjs';
import vm from 'node:vm';
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('library-data.js','utf8'),ctx);const data=ctx.window.LIBRARY;
const text=s=>s.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const norm=s=>s.toLowerCase().replace(/anti.?parkinsonian/g,'antiparkinson').replace(/x[ -]ray/g,'xray').replace(/\b101\b|\bpharmacokinetics\b|\bpharmacodynamics\b/g,'').replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w&&!['pharmacology','free','course','courses','explained','introduction','details','the','and','in','of','for'].includes(w)).map(w=>w.replace(/ies$/,'y').replace(/s$/,'')).join(' ');
const files=fs.readdirSync('.').filter(f=>f.endsWith('.html')&&!/^(index|legacy-home|about|Privacy Policy|Dr M All articles)\.html$/i.test(f)&&!/(course|courses)\.html$/i.test(f)&&f!=='Clinical Pharmacology Basic Principles.html');
const matched=[],unmatched=[];const assigned=new Set();
const stableNoteMap=JSON.parse(fs.readFileSync('content/legacy-note-map.json','utf8')); 
for(const v of data.videos){delete v.originalArticleId;delete v.notesHtml;delete v.source;}
for(const file of files){let raw=fs.readFileSync(file,'utf8');if(!raw.trim())continue;
 let body=raw.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]??raw;
 body=body.replace(/<head\b[\s\S]*?<\/head>/gi,'').replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<header\b[^>]*class=["'][^"']*site-header[^"']*["'][^>]*>[\s\S]*?<\/header>/gi,'').replace(/<nav\b[\s\S]*?<\/nav>/gi,'').replace(/<footer\b[\s\S]*?<\/footer>/gi,'');
 body=body.split(/<!--\s*Course (?:Menu|Topics)|<section\b[^>]*id=["']course-menu|<h2[^>]*>\s*Course (?:Topics|Menu)/i)[0];
 body=body.replace(/<section\b[^>]*>\s*<h2[^>]*>\s*Course[^]*$/i,'').replace(/<iframe\b[\s\S]*?<\/iframe>/gi,'').replace(/<!--[^]*?-->/g,'').replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i,'');
 // Remove controls and active markup while retaining lecture headings, lists and tables.
 body=body.replace(/<(style|form|button|object|embed)\b[\s\S]*?<\/\1>/gi,'').replace(/\s(?:on\w+|style|class|id)\s*=\s*(["']).*?\1/gi,'').replace(/<\/?(?:html|body|main|header|section|div)\b[^>]*>/gi,'');
 if(text(body).length<160)continue;
 const topic=norm(file.replace('.html',''));const embedded=raw.match(/youtube\.com\/embed\/([\w-]{11})/)?.[1];
 let ranked=data.videos.filter(v=>v.kind!=='shorts'&&!assigned.has(v.id)).map(v=>{const title=norm(v.title.split(':')[0]);const a=topic.split(' '),b=new Set(title.split(' '));const overlap=a.filter(w=>b.has(w)).length/a.length;let score=title===topic?100:title.startsWith(topic+' ')?95:overlap===1&&a.length>1?80+a.length:0;if(v.id===embedded)score=110;return {v,score}}).sort((a,b)=>b.score-a.score);
 // Explicitly disambiguate files whose historical title differs from the channel title.
 const special={'Shoulder X-ray Interpretation in 4 Steps.html':'How to Read Shoulder X Rays','Epilepsy Pathophysiology.html':'Epilepsy Explained','Antiparkinson Drugs Pharmacology.html':'Antiparkinsonian Drugs','Patient Factors Affecting Response to Drugs.html':'Patient Factors Affecting Response'}[file];
 if(special){const v=data.videos.find(v=>v.title.startsWith(special));if(v)ranked=[{v,score:120}]}
 // Established imports follow immutable video IDs, not mutable channel titles.
 if(stableNoteMap[file]){const v=data.videos.find(v=>v.id===stableNoteMap[file]&&v.kind!=='shorts'&&!assigned.has(v.id));if(!v){unmatched.push(file);continue}ranked=[{v,score:200}]}
 if(!ranked[0]?.score){unmatched.push(file);continue}const v=ranked[0].v;
 v.notesHtml=body;v.source=file;v.draft=false;assigned.add(v.id);matched.push({file,id:v.id,title:v.title});
}
// One canonical lecture object per video; courses reference it by ID.
const definitions=[
 ['pathology','Foundations of pathology','Pathology','Understand cellular adaptation, injury, and the mechanisms behind disease.','0-6,8-9'],
 ['pediatric','Pediatric & neonatal medicine','Pediatrics','Work through respiratory illness, neonatal presentations, and congenital conditions.','7,10-17,107,120,127-129'],
 ['cardiology','Cardiology & ECG essentials','Clinical medicine','Build a systematic approach to cardiac rhythms and acute coronary syndromes.','18-20,22,25,245'],
 ['airway','Airway & respiratory support','Clinical medicine','Learn airway assessment, oxygen delivery, and the principles of ventilation.','21,23-24,26-30,47'],
 ['gi','Gastrointestinal pharmacology','Pharmacology','Connect acid-related disease and antiemetic mechanisms to clinical use.','36-46,236,256,269'],
 ['liver','Hepatology essentials','Clinical medicine','Explore liver injury, portal hypertension, encephalopathy, and severity scores.','33-35,137,139,144,163,170,257-259'],
 ['asthma','Asthma & respiratory pharmacology','Pharmacology','Follow the mechanisms of controller, reliever, and targeted respiratory medicines.','48-60'],
 ['anticoagulation','Anticoagulants & fibrinolytics','Pharmacology','Compare anticoagulant pathways, thrombolysis, and key safety considerations.','61-63'],
 ['cns','CNS pharmacology','Pharmacology','An ordered learning path through analgesics, psychiatric medicines, and seizure treatment.','64-68,77,79,98-106,111-118,121-126,132-136,138,140-143,145-147,149-150,260-261'],
 ['trauma','Orthopedic trauma foundations','Orthopedics','Start with fracture mechanisms, healing, assessment, and principles of treatment.','69,76,169,171-190,233-234'],
 ['shoulder','Shoulder & arm trauma','Orthopedics','Study shoulder imaging, fractures, dislocations, and associated injuries.','84,87,89-97,251'],
 ['elbow','Elbow & forearm trauma','Orthopedics','Organize elbow and forearm injuries around anatomy, imaging, and stability.','71-75,85-86,88'],
 ['wrist','Wrist, hip & lower-limb fractures','Orthopedics','Review important fracture patterns and their classification systems.','31-32,70,238-239,246-250'],
 ['imaging','Chest imaging essentials','Clinical medicine','Develop a structured approach to normal chest films and common abnormalities.','108-110'],
 ['surgery','Surgery, wounds & burns','Clinical medicine','Explore tissue repair, burns, suturing, and common surgical presentations.','119,130-131,148,151-154,160-161,165,240-244,254'],
 ['renal','Renal medicine & fluid balance','Clinical medicine','Connect glomerular disease, water balance, fluids, and kidney injury.','155-159,166,262-263'],
 ['clinical','Clinical medicine essentials','Clinical medicine','Focused lessons on assessment, infection, oncology, and practical clinical concepts.','162,164,167-168,252,297'],
 ['principles','Clinical pharmacology principles','Pharmacology','Build the foundation: drug delivery, kinetics, receptors, and patient response.','191-201'],
 ['antibiotics','Antibiotics pharmacology','Pharmacology','Progress from bacterial targets to drug classes, resistance, and antibiotic selection.','202-224,264-268,270-296,298'],
 ['diuretics','Diuretics pharmacology','Pharmacology','Understand where each diuretic acts and how it changes fluid and electrolyte handling.','225-230'],
 ['cardiovascular-drugs','Cardiovascular & anti-inflammatory drugs','Pharmacology','Review adrenergic blockers, statins, calcium-channel blockers, and NSAIDs.','78,80-83,231-232,235,237,253,255']
];
const snapshot=data.videos;
if(!fs.existsSync('course-structure.json')){const courses=definitions.map(([id,title,category,description,ranges])=>({id,title,category,description,lectureIds:[...new Set(ranges.split(',').flatMap(part=>{const [a,b]=part.split('-').map(Number);return Array.from({length:(b??a)-a+1},(_,i)=>snapshot[a+i]?.id).filter(Boolean)}))]}));fs.writeFileSync('course-structure.json',JSON.stringify(courses,null,2))}
data.courses=JSON.parse(fs.readFileSync('course-structure.json','utf8'));for(const c of data.courses)c.lectureIds=c.lectureIds.filter(id=>data.videos.some(v=>v.id===id));
const sourceCourses={'principles':'Clinical Pharmacology Basic Principles.html','cns':'CNS Pharmacology Free Course.html','antibiotics':'Antibiotics Pharmacology Free Course.html','diuretics':'Diuretics Pharmacology Free Course.html','trauma':'Orthopedics trauma basic principles course.html','shoulder':'Shoulder and Arm Trauma Free Course.html','elbow':'Elbow and Forearm Trauma Free Course.html','pediatric':'Pediatric emergency medicine course.html'};
for(const c of data.courses){const file=sourceCourses[c.id];if(!file||!fs.existsSync(file))continue;const raw=fs.readFileSync(file,'utf8');const labels=[...raw.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(m=>norm(text(m[1])));const rank=v=>{const title=norm(v.title.split(':')[0]);const index=labels.findIndex(label=>label.length>3&&(title===label||title.startsWith(label)||label.startsWith(title)));return index<0?999:index};c.lectureIds.sort((a,b)=>rank(data.videos.find(v=>v.id===a))-rank(data.videos.find(v=>v.id===b)))}
const fileToId=new Map(matched.map(m=>[m.file.toLowerCase(),m.id]));
for(const v of data.videos){if(v.notesHtml){v.notesHtml=v.notesHtml.replace(/href=["']([^"']+)["']/gi,(all,href)=>{let target;try{target=fileToId.get(decodeURIComponent(href).toLowerCase())}catch{}return target?`href="#lecture/${target}"`:all});v.notesHtml=v.notesHtml.replace(/src=["']([^"']+)["']/gi,(all,src)=>{if(/^https?:|^data:/i.test(src))return all;if(fs.existsSync(src)){const mime=/\.png$/i.test(src)?'image/png':'image/jpeg';return `src="data:${mime};base64,${fs.readFileSync(src).toString('base64')}"`}return all})}v.courseIds=data.courses.filter(c=>c.lectureIds.includes(v.id)).map(c=>c.id)}
delete data.articles;
fs.writeFileSync('library-data.js','window.LIBRARY = '+JSON.stringify(data)+';\n');fs.writeFileSync('notes-migration-audit.json',JSON.stringify({matched,unmatched,uniqueVideoCount:new Set(data.videos.map(v=>v.id)).size,courses:data.courses.length},null,2));console.log(`Merged ${matched.length} complete lecture notes; ${unmatched.length} unmatched files; ${data.courses.length} courses.`);if(unmatched.length)console.log(unmatched);

const questionKeys=new Set(data.videos.flatMap(v=>v.questions.map(q=>JSON.stringify([q.prompt.trim().toLowerCase(),q.answer.trim().toLowerCase(),[...q.options].sort()]))));
fs.writeFileSync('content-audit.json',JSON.stringify({syncedAt:data.syncedAt,total:data.videos.length,unique:new Set(data.videos.map(v=>v.id)).size,originalNotes:matched.length,draftGuides:data.videos.length-matched.length,uniqueQuestions:questionKeys.size,courses:data.courses.length,missingNotes:data.videos.filter(v=>!v.notesHtml&&!v.notes?.length).map(v=>v.id),sourceMatches:matched},null,2));
