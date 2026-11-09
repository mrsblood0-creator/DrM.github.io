import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};
vm.runInNewContext(fs.readFileSync('library-data.js','utf8'),context);
const data=context.window.LIBRARY;
const slides=JSON.parse(fs.readFileSync('slide-notes.json','utf8'));
Object.assign(slides,JSON.parse(fs.readFileSync('content/pathology-slide-notes.json','utf8')));
Object.assign(slides,JSON.parse(fs.readFileSync('content/pharmacology-slide-notes.json','utf8')));
const verifiedText=JSON.parse(fs.readFileSync('content/verified-slide-text.json','utf8'));
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const withoutNotes=new Set(JSON.parse(fs.readFileSync('content/lecture-note-policy.json','utf8')).withoutNotes);
const audit=[];
const figureAliases=JSON.parse(fs.readFileSync('content/figure-aliases.json','utf8'));
const duplicateAudit=[];
const annotationLayers=new Set(JSON.parse(fs.readFileSync('content/annotation-layer-exclusions.json','utf8')));
const plainText=html=>html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const isCredit=html=>/\b(?:courtesy|wikimedia commons|CC\s*BY(?:-SA)?|CC0|public domain|image credit|photo credit)\b/i.test(plainText(html));
function cleanSlide(inner){
  inner=inner.replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/g,figure=>annotationLayers.has(figure.match(/src="([^"]+)"/)?.[1])?'':figure);
  const originalCaptions=[...inner.matchAll(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/g)].map(m=>plainText(m[1]));
  const creditText=text=>isCredit(text)||(/\brobbins\b/i.test(plainText(text)))||originalCaptions.some(c=>plainText(text).length>15&&c.includes(plainText(text)));
  // Keep source/licence information with figures, not in the teaching prose.
  const credits=[];
  inner=inner.replace(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/g,(all,tag,text)=>{
    if(/^thanks?\s+to\s+our\s+members[.!]?$/i.test(plainText(text)))return '';
    if(!creditText(text))return all;
    credits.push(text);return '';
  });
  inner=inner.replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/,(all,text)=>{
    if(!isCredit(text)&&!/^robbins\b/i.test(plainText(text)))return all;
    credits.push(text);return '<h3>Source figures</h3>';
  });
  const captions=[...inner.matchAll(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/g)].map(m=>plainText(m[1]));
  const missing=[...new Set(credits)].filter(c=>!captions.some(text=>text.includes(plainText(c))));
  if(missing.length){
    const credit=missing.join(' · ');
    // Keep slide-level credits below the actual figure instead of as loose prose.
    if(inner.includes('</figcaption>'))inner=inner.replace('</figcaption>',` · ${credit}</figcaption>`);
    else inner+=`<div class="figure-credit">${credit}</div>`;
  }
  // Turn explicit lists into semantic bullets without changing their wording.
  const cue=/(?:divided into|classified|classification|types|mechanisms|pathways|examples|loss of nucleus via|occurs? in|includes?|consists? of)/i;
  inner=inner.replace(/(<(?:h3|p)\b[^>]*>([^<]*(?:divided into|classified|classification|types|mechanisms|pathways|examples|loss of nucleus via|occurs? in|includes?|consists? of)[^<]*)<\/(?:h3|p)>)(\s*(?:<p>[^<]+<\/p>\s*){2,})/gi,(all,lead,label,tail)=>{
    if(!cue.test(plainText(label)))return all;
    const items=[...tail.matchAll(/<p>([^<]+)<\/p>/g)].map(m=>m[1]);
    // Longer explanatory paragraphs remain prose; only consecutive short entries are listed.
    let n=0;while(n<items.length&&plainText(items[n]).split(/\s+/).length<=14&&!/[.!?]$/.test(plainText(items[n])))n++;
    if(n<2)return all;
    return lead+'<ul>'+items.slice(0,n).map(t=>`<li>${t}</li>`).join('')+'</ul>'+items.slice(n).map(t=>`<p>${t}</p>`).join('');
  });
  return inner.replace(/<ul\b[^>]*>\s*<\/ul>/g,'').replace(/<div class="slide-gallery">\s*<\/div>/g,'');
}
for(const lecture of data.videos){
  if(withoutNotes.has(lecture.id)){
    Object.assign(lecture,{notesDisabled:true,notesHtml:'',notes:[],noteStatus:'Video and practice',readingMinutes:0,enriched:true,references:[]});
    audit.push({id:lecture.id,title:lecture.title,status:'Notes omitted by request',slides:0,selectableSections:0,frames:0,fullVideoAlignmentVerified:false});
    continue;
  }
  lecture.notesDisabled=false;
  const transcription=slides[lecture.id] ? null : verifiedText[lecture.id];
  const source=slides[lecture.id] || (transcription ? {html:transcription.sections.map(section=>`<section><h3>${E(section.heading)}</h3><p class="slide-timestamp"><a href="https://www.youtube.com/watch?v=${lecture.id}&amp;t=${section.seconds}s" target="_blank" rel="noopener">${Math.floor(section.seconds/60)}:${String(section.seconds%60).padStart(2,'0')} in the video</a></p>${section.paragraphs.map(p=>`<p>${E(p)}</p>`).join('')}${section.bullets?.length?`<ul>${section.bullets.map(p=>`<li>${E(p)}</li>`).join('')}</ul>`:''}</section>`).join('')} : null);
  const outline=[];
  const sections=[];
  const seenFigures=new Set();
  let currentSection=null;
  let body='';
  if(source){
    // Native source figures are permitted; captured video frames and generated
    // supplementary notes remain excluded.
    const text=source.html;
    const sourceHeadings=new Set([...text.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map(m=>plainText(m[1]).toLowerCase()));
    let introFigures='';
    let sourceIndex=0;
    for(const match of text.matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/g)){
      sourceIndex++;
      if(lecture.id==='I0ygFfqwhHw' && /<h3[^>]*>Slide 1<\/h3>/.test(match[1]))continue;
      if(/<h3[^>]*>\s*thanks?\s+to\s+our\s+members\s*[.!]?\s*<\/h3>/i.test(match[1]))continue;
      const inner=cleanSlide(match[1].replace(/<span class="slide-number">[\s\S]*?<\/span>/g,''));
      let heading=inner.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1]||'Presentation section';
      if(/^(?:thanks?(?: a lot| you| to our members)?|thank you(?: for (?:watching|listening|your attention))?)[.! ]*$/i.test(plainText(heading)))continue;
      let content=inner.replace(/<h3[^>]*>[\s\S]*?<\/h3>/,'');
      if(/^Slide\s+\d+\s*[.:]?$/i.test(plainText(heading))&&currentSection){
        currentSection.content+=content;
        continue;
      }
      if(/^Slide\s+\d+\s*[.:]?$/i.test(plainText(heading)))heading='Overview';
      const agendaItems=[...content.matchAll(/<(?:p|li)\b[^>]*>([^<]+)<\/(?:p|li)>/g)].map(m=>plainText(m[1]));
      const agendaMatches=agendaItems.filter(t=>sourceHeadings.has(t.toLowerCase())).length;
      const standardTopics=/^(definition|introduction|overview|epidemiology|causes|etiology|aetiology|risk factors|pathophysiology|pathogenesis|classification|types|clinical features(?: \(signs and symptoms\))?|signs(?: and symptoms)?|symptoms|presentation|diagnosis|investigations|differential diagnosis|treatment|management|complications|prognosis|prevention)$/i;
      const standardMatches=agendaItems.filter(t=>standardTopics.test(t)).length;
      const agenda=(lecture.id==='ionR1D5j3gI'&&sourceIndex===1)||((sourceIndex<=3||/^(?:lecture )?(?:contents|outline|agenda|topics covered)$/i.test(heading))&&agendaItems.length>=3&&agendaItems.every(t=>t.split(/\s+/).length<=9)&&(agendaMatches/agendaItems.length>=.7||standardMatches/agendaItems.length>=.8));
      if(agenda){
        introFigures+=(content.match(/<div class="slide-gallery">[\s\S]*?<\/div>/g)||[]).join('');
        introFigures+=(content.match(/<div class="figure-credit">[\s\S]*?<\/div>/g)||[]).join('');
        continue;
      }
      if(introFigures){
        content+=introFigures;
        introFigures='';
        // A repeated source credit belongs to the retained picture, not the prose.
        const credits=[...content.matchAll(/<div class="figure-credit">([\s\S]*?)<\/div>/g)].map(m=>m[1]);
        content=content.replace(/<div class="figure-credit">[\s\S]*?<\/div>/g,'');
        if(credits.length)content=content.replace('</figcaption>',` · ${[...new Set(credits)].join(' · ')}</figcaption>`);
      }
      if(!content.replace(/<[^>]+>/g,'').trim())continue;
      const figureOnly=heading==='Source figures'||(/^Slide \d+$/i.test(heading)&&!/<(?:p|table|ul)\b/.test(content));
      if(figureOnly){
        if(currentSection)currentSection.content+=content;
        else {currentSection={heading:lecture.title,content};sections.push(currentSection);}
        continue;
      }
      if(/^Slide \d+$/i.test(heading)&&content.includes('<table>')){
        const columns=[...content.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(m=>plainText(m[1])).filter(Boolean);
        if(columns.length>=2&&columns.length<=4)heading='Comparison: '+columns.join(' and ');
      }
      let group=heading;
      if(lecture.id==='I-_HV25j_9s'){
        if(/^Comparison:/.test(heading)){heading='Comparison between necrosis and apoptosis';group=heading;}
        else if(['Cell death','Morphologic hallmark of cell death','Mechanisms of cell death'].includes(heading))group='Cell death overview';
        else if(/^(?:Necrosis|Coagulative necrosis|Red infarction|Liquefactive necrosis|Occurs in|Gangrenous necrosis|Caseous necrosis|Fat necrosis|Saponification|Fibrinoid necrosis)$/.test(heading))group='Necrosis';
        else if(/Apoptosis|caspases|Caspases|Intrinsic mitochondrial|Extrinsic receptor|Cytotoxic CD8/.test(heading))group='Apoptosis';
      }
      if(lecture.id==='I0ygFfqwhHw'){
        if(['Amyloid','Amyloidosis'].includes(heading))group='Overview';
        else if(/Classification|Primary amyloidosis|Reactive Systemic|Heredofamilial|Familial Mediterranean|Transthyretin|Senile systemic/i.test(heading))group='Classification';
        else if(/Localized amyloidosis|Insulin Dependent|Medullary carcinoma|Alzheimer disease|Dialysis-associated/i.test(heading))group='Localized and other forms';
        else if(heading==='Damaged organs must be transplanted')group='Treatment';
      }
      let section=sections.find(s=>s.heading===group);
      if(!section){section={heading:group,content:''};sections.push(section);}
      currentSection=section;
      section.content+=(group!==heading?`<h3>${heading}</h3>`:'')+content;
    }
  }
  // Deduplicate within a lecture, retaining all distinct source attributions.
  const figures=new Map();
  const canonical=src=>{const visited=new Set();while(figureAliases[src]&&!visited.has(src)){visited.add(src);src=figureAliases[src];}return src;};
  for(const section of sections){
    section.content=section.content.replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/g,figure=>{
      const src=figure.match(/src="([^"]+)"/)?.[1];
      if(!src)return figure;
      const key=canonical(src),caption=figure.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/)?.[1];
      if(figures.has(key)){
        const first=figures.get(key);
        if(caption&&!first.captions.includes(caption))first.captions.push(caption);
        duplicateAudit.push({lecture:lecture.id,removed:src,retained:first.src});
        return '';
      }
      const token='<!--retained-figure-'+figures.size+'-->';
      figures.set(key,{src,figure,token,captions:caption?[caption]:[]});return token;
    }).replace(/<div class="slide-gallery">\s*<\/div>/g,'');
  }
  for(const section of sections)for(const item of figures.values()){
    const seenCredits=new Set();
    let sourceLabelSeen=false;
    const captions=item.captions.flatMap(c=>c.split(/\s+·\s+/)).filter(part=>{
      const key=plainText(part).toLowerCase().replace(/\s+/g,' ').trim();
      if(!key||seenCredits.has(key))return false;
      if(/^original slide \d+ figure$/i.test(key)){
        if(sourceLabelSeen)return false;
        sourceLabelSeen=true;
      }
      seenCredits.add(key);return true;
    });
    const figure=item.figure.replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/,'<figcaption>'+captions.join(' · ')+'</figcaption>');
    section.content=section.content.replace(item.token,()=>figure);
  }
  for(const section of sections){
    if(!section.heading){body+=section.content;continue;}
    if(/complications?/i.test(section.heading)){
      // A short named complication followed by explanatory prose is a subtopic,
      // rather than another bullet at the same level as its explanation.
      let previousTopic='';
      section.content=section.content.replace(/<p>([^<>]+)<\/p>/g,(all,text)=>{
        const label=plainText(text).replace(/:$/,'').trim();
        const named=/\b(?:injur(?:y|ies)|palsy|syndrome|union|nonunion|malunion|stiffness|necrosis|arthritis|osteoarthritis|infection|instability|displacement|dislocation|synostosis|rupture|tear|capsulitis|compression|edema|failure|thrombosis|sepsis|pneumothorax|hypoglycemia|encephalopathy|coagulopathy|hemarthrosis|deformity|lymphoma|arrhythmias|seizures)\b/i;
        if(label.split(/\s+/).length>8||!named.test(label)||/[.;]/.test(label)||/^(?:treated|treatment|rate|risk|more|if|can|the|this|it|all|no|most)\b/i.test(label))return all;
        if(previousTopic===label.toLowerCase())return '';
        previousTopic=label.toLowerCase();
        return '<h3>'+text+'</h3>';
      });
    }
    if(lecture.id==='qRLw6NOBqjI'){
      // Keep the initial joint checklist; promote subsequent source topic labels.
      let jointMentions=0;
      section.content=section.content.replace(/<p>([\s\S]*?)<\/p>/g,(all,text)=>{
        if(text==='AC joint'){
          jointMentions++;
          return jointMentions===1?all:jointMentions===2?'<h3>AC joint</h3>':'';
        }
        if(/^(Glenohumeral joint|AC joint series):/i.test(text)){
          const colon=text.indexOf(':');return '<h3>'+text.slice(0,colon)+'</h3><p>'+text.slice(colon+1).trim()+'</p>';
        }
        if(/^(Shoulder|Clavicle|SC joint) series$/i.test(text))return '<h3>'+text+'</h3>';
        return all;
      });
    }
    // Use the same study-note layout throughout the library.
    const stepSection=true;
    let listActive=stepSection,lastLabel='';
    const labels=/^(?:symptoms|signs|signs and symptoms|physical examination|examination|inspection|palpation|auscultation|percussion|indications|contraindications|absolute contraindications|relative contraindications|advantages|disadvantages|risk factors|clinical features|investigations|differential diagnosis|non[ -]?operative(?: treatment)?|operative(?: treatment)?|conservative treatment|surgical treatment|medical treatment|early complications|late complications)$/i;
    section.content=section.content.replace(/<(?:figure|table)\b[^>]*>[\s\S]*?<\/(?:figure|table)>|<h[34]\b[^>]*>[\s\S]*?<\/h[34]>|<p>([\s\S]*?)<\/p>/g,(paragraph,text)=>{
      if(text===undefined){listActive=stepSection;lastLabel='';return paragraph;}
      const label=plainText(text).replace(/[:.]$/,'').trim();
      const examLabel=/^(look|feel|move)$/i.test(label)&&/clinical|examination/i.test(section.heading);
      const timingLabel=/^(early|late|immediate|delayed)$/i.test(label)&&/complication/i.test(section.heading);
      const descriptionLabel=/^when describing .{1,100}(?:comment on|assess)$/i.test(label);
      const checklistLabel=/^(?:assess|check|look for|evaluate|examine|assessment includes|check the following|consider the following|indications (?:of|for) (?:operative|surgical|non operative) treatment)$/i.test(label);
      if(labels.test(label)||examLabel||timingLabel||descriptionLabel||checklistLabel){
        listActive=true;
        if(label.toLowerCase()===lastLabel)return '';
        lastLabel=label.toLowerCase();
        const tag=examLabel?'h4':'h3';
        return '<'+tag+'>'+text+'</'+tag+'>';
      }
      return listActive?'<ul><li>'+text+'</li></ul>':paragraph;
    }).replace(/<\/ul>\s*<ul>/g,'');
    // Emphasize short, explicit labels without guessing new medical headings.
    section.content=section.content.replace(/<li>([^<>:]{2,70}):\s*([^<][\s\S]*?)<\/li>/g,(all,label,detail)=>{
      if(label.trim().split(/\s+/).length>8||/https?|\d$/.test(label))return all;
      return '<li><strong class="note-label">'+label+':</strong> '+detail+'</li>';
    });
    if(lecture.id==='n9brM9pTw6I'&&section.heading==='Examples of Free radical injury'){
      // The presentation repeats the same example list across two slides.
      // Retain one list while preserving the intervening figures and captions.
      let examplesSeen=false;
      section.content=section.content.replace(/<ul><li>CCl4<\/li><li>Reperfusion injury<\/li><\/ul>/g,list=>{
        if(examplesSeen)return '';
        examplesSeen=true;return list;
      });
    }
    const id=`note-${lecture.id}-${outline.length+1}`;
    const children=[];
    const sectionContent=section.content.replace(/<h3>([\s\S]*?)<\/h3>/g,(all,heading)=>{
      const childId=`${id}-topic-${children.length+1}`;
      children.push({id:childId,heading});
      return `<h3 id="${childId}" tabindex="-1">${heading}</h3>`;
    });
    outline.push({id,heading:section.heading,children});
    body+=`<section class="lecture-text-section" id="${id}" tabindex="-1"><h2>${section.heading}</h2>${sectionContent}</section>`;
  }
  const count=outline.length;
  const status=count?(transcription?'Partial slide transcription':'Source presentation'):'Slide transcription pending';
  const practiceId=`practice-${lecture.id}`;
  const normalized=s=>plainText(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  // A classification's own list gives an explicit, source-backed parent/child relationship.
  const nestedIds=new Set();
  outline.forEach((entry,index)=>{
    const section=sections.filter(s=>s.heading)[index];
    if(!section||!/types|classification|mechanisms|pathways|classes/i.test(entry.heading))return;
    const listed=new Set([...section.content.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(m=>normalized(m[1])));
    for(const child of outline.slice(index+1)){
      if(!nestedIds.has(child.id)&&listed.has(normalized(child.heading))){entry.children.push(child);nestedIds.add(child.id);}
    }
  });
  let tocEntries=outline.filter(x=>!nestedIds.has(x.id));
  if(tocEntries.length>1&&!tocEntries.some(x=>x.children.length))tocEntries=[{heading:'Lecture topics',children:tocEntries}];
  const renderEntries=entries=>entries.map(x=>`<li>${x.id?`<a href="#${x.id}" data-scroll-note="${x.id}">${x.heading}</a>`:`<span class="contents-group">${x.heading}</span>`}${x.children?.length?`<ol>${renderEntries(x.children)}</ol>`:''}</li>`).join('');
  const toc=`<nav class="lecture-outline" aria-label="Lecture contents"><details open><summary>Contents</summary><ol>${renderEntries(tocEntries)}<li><a href="#${practiceId}" data-scroll-note="${practiceId}">Questions and flashcards</a></li></ol></details></nav>`;
  const practice=`<section id="${practiceId}" class="lecture-practice" tabindex="-1"><h2>Continue learning</h2><p>Practice the topics covered in this lecture.</p><div><a href="/#bank/${lecture.id}">Lecture questions <span aria-hidden="true">→</span></a><a href="/#flashcards/${lecture.id}">Lecture flashcards <span aria-hidden="true">→</span></a></div></section>`;
  lecture.notesHtml=`<div class="lecture-reader" data-notes-root="${lecture.id}">${toc}<div class="lecture-reading-body">${count?'<div class="notes-toolbar" role="group" aria-label="Use these lecture notes"><button type="button" data-note-action="copy">Copy notes</button><button type="button" data-note-action="edit" aria-expanded="false">Edit my copy</button><button type="button" data-note-action="download">Download text</button></div><p data-note-status role="status" aria-live="polite"></p><section data-note-editor hidden><label>My editable lecture notes<textarea rows="18" spellcheck="true" aria-label="My editable lecture notes"></textarea></label><p>Edits save on this browser. Download a copy for your records.</p></section>':''}<div data-note-content>${body}</div>${practice}</div></div>`;
  lecture.noteStatus=status;
  lecture.enriched=true;
  delete lecture.illustration;
  lecture.notes=[];
  lecture.references=[{title:'Source lecture on YouTube',url:`https://www.youtube.com/watch?v=${lecture.id}`}];
  lecture.readingMinutes=count?Math.max(1,Math.ceil(body.replace(/<[^>]+>/g,' ').split(/\s+/).length/200)):0;
  audit.push({id:lecture.id,title:lecture.title,status,slides:source?.slideCount||0,selectableSections:count,frames:0,fullVideoAlignmentVerified:false});
}
fs.writeFileSync('library-data.js','window.LIBRARY = '+JSON.stringify(data)+';\n');
fs.writeFileSync('expanded-notes-audit.json',JSON.stringify(audit,null,2)+'\n');
console.log(`Built source lecture notes: ${audit.filter(x=>x.selectableSections).length} lectures with source content; ${audit.filter(x=>x.status==='Slide transcription pending').length} pending transcriptions.`);

fs.writeFileSync('content/duplicate-figures-audit.json',JSON.stringify(duplicateAudit,null,2));
