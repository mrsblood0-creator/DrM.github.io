import fs from 'node:fs';
const targets=JSON.parse(fs.readFileSync('content/study-targets.json','utf8'));
if(!Number.isInteger(targets.defaultMinimum)||targets.defaultMinimum<1)throw Error('Invalid default study target');
for(const n of Object.values(targets.lectureMinimums))if(!Number.isInteger(n)||n<targets.defaultMinimum)throw Error('Invalid lecture study target');
export const minimumForLecture=id=>targets.lectureMinimums[id]??targets.defaultMinimum;

export const defaultStudyMinimum=targets.defaultMinimum;
