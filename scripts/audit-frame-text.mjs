import fs from 'node:fs';
const frames=JSON.parse(fs.readFileSync('video-frame-notes.json','utf8'));
const reviewed=JSON.parse(fs.readFileSync('content/frame-transcriptions/reviewed.json','utf8'));
const slideText=JSON.parse(fs.readFileSync('content/verified-slide-text.json','utf8'));
const decks=Object.assign({},...['slide-notes.json','content/pathology-slide-notes.json','content/pharmacology-slide-notes.json'].map(p=>JSON.parse(fs.readFileSync(p,'utf8'))));
const coverage=Object.entries(frames).map(([id,source])=>{
  const file=`content/frame-transcriptions/drafts/${id}.json`;
  const draft=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')):null;
  const sections=reviewed[id]?.sections||[];
  const captionTimes=new Set();
  if(reviewed[id]?.sourceType==='narration'){
    const captions=fs.readFileSync(`content/transcripts/${id}.txt`,'utf8');
    for(const m of captions.matchAll(/\[(\d+):(\d{2})\]/g))captionTimes.add(Number(m[1])*60+Number(m[2]));
  }
  for(const s of sections){
    if(!s.heading||!s.paragraphs?.length||!(captionTimes.has(s.seconds)||source.frames.some(f=>f.seconds===s.seconds)))throw Error('Invalid reviewed source timestamp: '+id);
  }
  const publishedSections=slideText[id]?.sections||[];
  for(const section of publishedSections){
    if(!source.frames.some(frame=>frame.src===section.sourceFrame&&frame.seconds===section.seconds))throw Error('Slide text provenance mismatch: '+id);
    if(!section.heading||!(section.paragraphs?.length||section.bullets?.length))throw Error('Incomplete slide text section: '+id);
  }
  return {id,sourceFrames:source.frames.length,draftFrames:draft?.frames.length||0,reviewedTextSections:sections.length,publishedSlideTextSections:decks[id]?0:publishedSections.length,archivedSlideTextSections:decks[id]?publishedSections.length:0,completeVideoTranscript:false};
});
const report={lecturesWithFrames:coverage.length,draftFrames:coverage.reduce((n,x)=>n+x.draftFrames,0),lecturesWithReviewedText:coverage.filter(x=>x.reviewedTextSections).length,lecturesWithPublishedSlideText:coverage.filter(x=>x.publishedSlideTextSections).length,coverage};
fs.writeFileSync('frame-text-audit.json',JSON.stringify(report,null,2));
console.log({lecturesWithFrames:report.lecturesWithFrames,draftFrames:report.draftFrames,lecturesWithReviewedText:report.lecturesWithReviewedText});
