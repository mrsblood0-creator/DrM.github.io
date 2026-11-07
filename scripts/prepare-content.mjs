import { minimumForLecture } from './study-targets.mjs';
import fs from "node:fs";
import vm from "node:vm";
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync("library-data.js", "utf8"), ctx);
const d = ctx.window.LIBRARY;
d.videos = d.videos.filter((v) => v.kind !== "shorts");
const valid = new Set(d.videos.map((v) => v.id));
fs.mkdirSync("content", { recursive: true });
for (const [f, value] of [
  [
    "site.json",
    {
      name: "Dr M Medical Academy",
      url: "https://www.drmcourses.com",
      description:
        "Medical lecture notes, ordered video courses, original USMLE-style practice questions and spaced-repetition flashcards.",
    },
  ],
  ["lecture-overrides.json", {}],
  ["additional-lectures.json", []],
])
  if (!fs.existsSync("content/" + f))
    fs.writeFileSync("content/" + f, JSON.stringify(value, null, 2));
const extra = JSON.parse(fs.readFileSync("content/additional-lectures.json"));
for (const v of extra) {
  if (!valid.has(v.id)) {
    d.videos.push({
      ...v,
      kind: "videos",
      notes: v.notes || [],
      questions: v.questions || [],
    });
    valid.add(v.id);
  }
}
const overrides = JSON.parse(fs.readFileSync("content/lecture-overrides.json"));
for (const v of d.videos) {
  Object.assign(v, overrides[v.id] || {});
  v.thumbnail = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg?v=${d.syncedAt.slice(0, 10)}`;
}
if (fs.existsSync("content/courses.json"))
  d.courses = JSON.parse(fs.readFileSync("content/courses.json"));
for (const c of d.courses)
  c.lectureIds = c.lectureIds.filter((id) => valid.has(id));
d.courses = d.courses.filter((c) => c.lectureIds.length);
for (const v of d.videos)
  v.courseIds = d.courses
    .filter((c) => c.lectureIds.includes(v.id))
    .map((c) => c.id);
const qfiles = fs
  .readdirSync("content")
  .filter((f) => /^questions-.*\.json$/.test(f))
  .sort((a,b)=>Number(a.startsWith('questions-reviewed-'))-Number(b.startsWith('questions-reviewed-')) || a.localeCompare(b));
// Authors save incrementally. Publish only complete per-lecture replacement sets.
const readySets = new Map();
const pendingSets = [];
for (const kind of ['questions','flashcards']) {
  for (const file of fs.readdirSync('content').filter(f=>f.startsWith(kind+'-reviewed-') && f.endsWith('.json'))) {
    const rows=JSON.parse(fs.readFileSync('content/'+file,'utf8'));
    const groups=Map.groupBy(rows,row=>row.lectureId);
    const ready=new Set();
    for (const [id,items] of groups) {
      const complete=items.length>=minimumForLecture(id) && new Set(items.map(i=>i.id)).size===items.length && items.every(i=>
        i.id && (kind==='questions' ? i.prompt && i.options?.length===5 && new Set(i.options).size===5 && i.options.includes(i.answer) && i.references?.length && i.options.every(o=>i.distractorExplanations?.[o]) : i.front && i.back && i.explanation));
      if (complete) ready.add(id); else pendingSets.push({file,lectureId:id,count:items.length});
    }
    readySets.set(file,ready);
  }
}
fs.writeFileSync('content/pending-review-sets.json',JSON.stringify(pendingSets,null,2));
if (qfiles.length) {
  for (const v of d.videos) v.questions = [];
  const replaced = new Set();
  for (const file of qfiles)
    for (const q of JSON.parse(fs.readFileSync("content/" + file))) {
      if (readySets.has(file) && !readySets.get(file).has(q.lectureId)) continue;
      const v = d.videos.find((v) => v.id === q.lectureId);
      if (!v) throw Error("Question lecture missing: " + q.id);
      // Use the catalogue's subject labels so every question is discoverable
      // through the same subject filters as its source lecture.
      q.category = v.category;
      if (file.startsWith('questions-reviewed-') && !replaced.has(v.id)) {
        v.questions = [];
        replaced.add(v.id);
      }
      v.questions.push(q);
    }
}
const flashfiles = fs
  .readdirSync("content")
  .filter((f) => /^flashcards-.*\.json$/.test(f));
const reviewedCardLectures = new Set(flashfiles.filter(f=>f.startsWith('flashcards-reviewed-')).flatMap(f=>[...readySets.get(f)]));
const flash = [];
for (const file of flashfiles)
  for (const c of JSON.parse(fs.readFileSync("content/" + file))) {
    if (readySets.has(file) && !readySets.get(file).has(c.lectureId)) continue;
    if (valid.has(c.lectureId) && (file.startsWith('flashcards-reviewed-') || !reviewedCardLectures.has(c.lectureId))) flash.push(c);
  }
const counts = new Map();
d.flashcards = flash.map((c) => ({
  ...c,
  id: c.id || "fc-" + c.lectureId + "-" + (counts.set(c.lectureId, (counts.get(c.lectureId) || 0) + 1).get(c.lectureId)),
}));
fs.writeFileSync(
  "library-data.js",
  "window.LIBRARY = " + JSON.stringify(d) + ";\n",
);
console.log(
  `${d.videos.length} full lectures; ${d.courses.length} courses; ${d.flashcards.length} flashcards; Shorts excluded.`,
);
