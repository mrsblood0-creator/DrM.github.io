import fs from 'node:fs';
const p='content/verified-slide-text.json',d=JSON.parse(fs.readFileSync(p));
d['sVML-mz1Ato'].sections[3].paragraphs=d['sVML-mz1Ato'].sections[3].paragraphs.filter(x=>!x.startsWith('Micropoint:'));
d['9XK3e8-iZFA']={complete:false,reviewedAt:'2026-11-05',method:'Manually read the scoring, interpretation and limitations slides in the higher-resolution YouTube player. Listed preview frames identify corresponding slide timestamps. Full-video coverage remains unverified.',sections:[
{heading:'Scoring — eye opening',seconds:26,sourceFrame:'video-frames/9XK3e8-iZFA-13.jpg',paragraphs:['1: None','2: Open to pain','3: Open to voice','4: Open spontaneously']},
{heading:'Scoring — verbal response',seconds:26,sourceFrame:'video-frames/9XK3e8-iZFA-13.jpg',paragraphs:['1: None','2: Incomprehensible sounds (like moaning)','3: Inappropriate words (random)','4: Confused or disoriented','5: Oriented']},
{heading:'Scoring — motor response',seconds:26,sourceFrame:'video-frames/9XK3e8-iZFA-13.jpg',paragraphs:['1: None','2: Extensor posturing','3: Flexor posturing','4: Withdrawal in response to pain','5: Localize pain','6: Follows commands']},
{heading:'Interpretation',seconds:124,sourceFrame:'video-frames/9XK3e8-iZFA-62.jpg',paragraphs:['GCS 13–15 = mild injury','GCS 9–12 = moderate injury','GCS 3–8 = severe injury']},
{heading:'Limitations',seconds:156,sourceFrame:'video-frames/9XK3e8-iZFA-78.jpg',paragraphs:['A variety of independent factors may interfere with the applicability of the GCS to trauma patients such as intoxication, sepsis or shock','Interobserver reliability is imperfect']}
]};fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
