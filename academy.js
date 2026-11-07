const $ = (s) => document.querySelector(s),
  D = window.LIBRARY,
  V = D.videos,
  C = D.courses,
  byId = new Map(V.map((v) => [v.id, v]));
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function read(k, f) {
  try {
    const value = JSON.parse(localStorage.getItem(k));
    if (value == null) return f;
    if (Array.isArray(f)) return Array.isArray(value) ? value : f;
    if (f === null || typeof f === 'object') return typeof value === 'object' && !Array.isArray(value) ? value : f;
    return typeof value === typeof f ? value : f;
  } catch {
    return f;
  }
}
function write(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
}
const saved = new Set(read("drm-saved", []).filter((id) => byId.has(id))),
  done = new Set(read("drm-completed", []).filter((id) => byId.has(id)));
let subject = "All lectures",
  limit = 12,
  lesson = null,
  courseContext = null,
  toastTimer;
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 2500);
}
const subjects = [...new Set(V.map((v) => v.category))].sort();
function hash(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36);
}
const qMap = new Map();
for (const v of V)
  for (const q of v.questions) {
    const key = JSON.stringify([
      q.prompt.trim().toLowerCase(),
      q.answer.trim().toLowerCase(),
      [...q.options].sort(),
    ]);
    const id = "q-" + hash(key);
    if (qMap.has(id)) {
      qMap.get(id).lectureIds.push(v.id);
    } else
      qMap.set(id, {
        ...q,
        id,
        lectureIds: [v.id],
        category: q.category || v.category,
      });
  }
const Q = [...qMap.values()];
let qSaved = new Set(read("drm-q-saved", [])),
  outcomes = read("drm-q-outcomes", {}),
  history = read("drm-q-history", []),
  session = read("drm-q-session", null),
  reviewFilter = "all";
qSaved = new Set([...qSaved].filter(id => qMap.has(id)));
outcomes = Object.fromEntries(Object.entries(outcomes).filter(([id,value]) => qMap.has(id) && value && typeof value.correct === 'boolean'));
history = history.filter(item => item && Number.isFinite(item.score) && Number.isFinite(item.total) && item.total > 0 && item.score >= 0 && item.score <= item.total);
if (
  session &&
  (!Array.isArray(session.ids) || !session.ids.length || !session.ids.every((id) => qMap.has(id)) ||
   !Number.isInteger(session.index) || session.index < 0 || session.index >= session.ids.length ||
   !['tutor','exam'].includes(session.mode) || !Array.isArray(session.flags) || !Array.isArray(session.checked) ||
   !session.answers || typeof session.answers !== 'object' || Array.isArray(session.answers) ||
   !session.options || !session.ids.every(id => Array.isArray(session.options[id]) && session.options[id].length === qMap.get(id).options.length && new Set(session.options[id]).size === qMap.get(id).options.length && session.options[id].every(o=>qMap.get(id).options.includes(o))) ||
   (session.timed && (!Number.isFinite(session.remaining) || (!session.paused && !Number.isFinite(session.deadline)))))
)
  session = null;
const progress = (c) => c.lectureIds.filter((id) => done.has(id)).length;
const pct = (c) =>
  Math.round((progress(c) / Math.max(c.lectureIds.length, 1)) * 100);
function metrics() {
  $("#lecture-total").textContent = V.length;
  $("#course-total").textContent = C.length;
  $("#question-total").textContent = Q.length;
  $("#completed-total").textContent = done.size;
}
$("#copyright").textContent = `© ${new Date().getFullYear()}. All rights reserved.`;
$("#subject-filters").innerHTML = ["All lectures", ...subjects]
  .map(
    (s) =>
      `<button class="chip ${s === subject ? "active" : ""}" data-subject="${esc(s)}" aria-pressed="${s === subject}">${esc(s)}<span>${s === "All lectures" ? V.length : V.filter((v) => v.category === s).length}</span></button>`,
  )
  .join("");
function renderLibrary() {
  const query = $("#lecture-search").value.toLowerCase().trim();
  let list = V.filter(
    (v) =>
      (subject === "All lectures" || v.category === subject) &&
      (!$("#saved-only").checked || saved.has(v.id)) &&
      v.title.toLowerCase().includes(query),
  );
  const sort = $("#lecture-sort").value;
  if (sort === "az") list.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "progress")
    list.sort((a, b) => Number(done.has(a.id)) - Number(done.has(b.id)));
  $("#lecture-results").textContent =
    `${list.length} lectures · ${Math.min(limit, list.length)} shown`;
  $("#lecture-grid").innerHTML =
    list
      .slice(0, limit)
      .map(
        (v) =>
          `<article class="lecture-card"><a class="thumb" href="#lecture/${v.id}" aria-label="Watch ${esc(v.title)}"><img loading="lazy" src="${esc(v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`)}" alt=""><span class="play">▶</span><span class="duration">${esc(v.duration || "Video")}</span></a><div class="lecture-card-body"><div class="card-top"><span class="subject">${esc(v.category)}${v.kind === "shorts" ? " · SHORT" : ""}</span><button class="save-button" data-save="${v.id}" aria-label="${saved.has(v.id) ? "Unsave" : "Save"} ${esc(v.title)}" aria-pressed="${saved.has(v.id)}">${saved.has(v.id) ? "◆" : "◇"}</button></div><h3><a href="#lecture/${v.id}">${esc(v.title)}</a></h3><div class="card-foot"><span>▤ ${v.noteStatus || "Lecture notes"}</span><span>${done.has(v.id) ? "✓ Completed" : "Start learning ↗"}</span></div></div></article>`,
      )
      .join("") ||
    '<div class="empty">No lectures found. Try another subject or search term.</div>';
  $("#load-more").hidden = limit >= list.length;
  metrics();
}
$("#subject-filters").onclick = (e) => {
  const b = e.target.closest("[data-subject]");
  if (!b) return;
  subject = b.dataset.subject;
  for (const el of document.querySelectorAll("[data-subject]")) {
    el.classList.toggle("active", el === b);
    el.setAttribute("aria-pressed", el === b);
  }
  limit = 12;
  renderLibrary();
};
for (const id of ["lecture-search", "lecture-sort", "saved-only"])
  $("#" + id).addEventListener("input", () => {
    limit = 12;
    renderLibrary();
  });
$("#load-more").onclick = () => {
  limit += 12;
  renderLibrary();
};
function toggleLecture(id) {
  saved.has(id) ? saved.delete(id) : saved.add(id);
  write("drm-saved", [...saved]);
  renderLibrary();
  if (lesson)
    $("#save-lecture").textContent = saved.has(lesson.id)
      ? "◆ Saved"
      : "◇ Save lecture";
}
$("#lecture-grid").onclick = (e) => {
  const b = e.target.closest("[data-save]");
  if (b) toggleLecture(b.dataset.save);
};
function renderCourses() {
  const query = $("#course-search").value.toLowerCase().trim();
  const list = C.filter((c) =>
    (c.title + " " + c.category + " " + c.description)
      .toLowerCase()
      .includes(query),
  );
  $("#course-results").textContent = `${list.length} courses to explore`;
  $("#course-grid").innerHTML =
    list
      .map(
        (c, i) =>
          `<article class="course-card"><div class="course-icon">${["▤", "✚", "◎", "⌘"][i % 4]}</div><span class="subject">${esc(c.category)}</span><h3><a href="#course/${c.id}">${esc(c.title)}</a></h3><p>${esc(c.description)}</p>${c.playlistUrl ? `<a class="playlist-source" href="${esc(c.playlistUrl)}" target="_blank" rel="noopener">View source playlist ↗</a>` : ""}<div class="course-meta"><span>${c.lectureIds.length} lectures</span><span>${progress(c)} completed</span></div><div class="progress-track" aria-label="${pct(c)} percent complete"><span style="width:${pct(c)}%"></span></div><a class="button outline" href="#course/${c.id}">${progress(c) ? "Continue course" : "Explore course"} ↗</a></article>`,
      )
      .join("") || '<p class="empty">No matching courses.</p>';
}
$("#course-search").oninput = renderCourses;
function openCourse(c) {
  const next = c.lectureIds.find((id) => !done.has(id)) || c.lectureIds[0];
  $("#course-header").innerHTML =
    `<span class="eyebrow">${esc(c.category)} · ${c.lectureIds.length} LECTURES</span><h1>${esc(c.title)}</h1><p>${esc(c.description)}</p><div class="course-meta"><span>${progress(c)} of ${c.lectureIds.length} completed</span><span>${pct(c)}%</span></div><div class="progress-track"><span style="width:${pct(c)}%"></span></div><a class="button" href="#lecture/${next}?course=${c.id}">${progress(c) ? "Continue learning" : "Start this course"} →</a>`;
  $("#curriculum-count").textContent = c.lectureIds.length + " lectures";
  $("#curriculum").innerHTML = c.lectureIds
    .map((id, i) => {
      const v = byId.get(id);
      return `<a class="curriculum-row" href="#lecture/${id}?course=${c.id}"><span class="lesson-number">${done.has(id) ? "✓" : String(i + 1).padStart(2, "0")}</span><div><strong>${esc(v.title)}</strong><small>${esc(v.duration || "Video")} · ${v.source ? "Lecture notes" : "Study guide"}</small></div><span>↗</span></a>`;
    })
    .join("");
  $("#course-practice").onclick = () => {
    setBankCourse(c.id);
    location.hash = "bank";
  };
}
function sanitizeNotes(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll(
      "script,style,iframe,object,embed,form,input,link,meta,base,footer",
    )
    .forEach((el) => el.remove());
  for (const el of doc.body.querySelectorAll("*")) {
    for (const attr of [...el.attributes])
      if (
        /^on/i.test(attr.name) ||
        ["srcdoc", "style"].includes(attr.name) ||
        (["href", "src"].includes(attr.name) &&
          /^\s*(javascript|vbscript):/i.test(attr.value))
      )
        el.removeAttribute(attr.name);
  }
  return doc.body.innerHTML;
}
function openLesson(v, context) {
  lesson = v;
  courseContext =
    C.find((c) => c.id === context && c.lectureIds.includes(v.id)) ||
    C.find((c) => c.lectureIds.includes(v.id));
  $("#lesson-back").href = courseContext
    ? "#course/" + courseContext.id
    : "#library";
  $("#lesson-back").textContent = courseContext
    ? "← " + courseContext.title
    : "← Lecture library";
  $("#video-player").innerHTML =
    `<iframe src="https://www.youtube-nocookie.com/embed/${v.id}" title="${esc(v.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  $("#lesson-title").textContent = v.title;
  $("#lesson-subject").textContent = v.category;
  $("#save-lecture").textContent = saved.has(v.id)
    ? "◆ Saved"
    : "◇ Save lecture";
  $("#complete-lecture").textContent = done.has(v.id)
    ? "✓ Completed"
    : "Mark complete";
  $("#watch-youtube").href = "https://www.youtube.com/watch?v=" + v.id;
  $("#lesson-question-link").href = "#bank/" + v.id;
  $("#lesson-flashcard-link").href = "#flashcards/" + v.id;
  $("#lecture-notes-panel").hidden = !!v.notesDisabled;
  $("#reading-time").textContent = (v.readingMinutes || 5) + " min read";
  $("#notes-provenance").textContent = "";
  $("#lecture-notes").innerHTML = v.notesHtml
    ? sanitizeNotes(v.notesHtml)
    : v.notes
        .map((b) => {
          const tag = ["h2", "h3"].includes(b.type) ? b.type : "p";
          return `<${tag} class="${b.type === "li" ? "note-point" : ""}">${esc(b.text)}</${tag}>`;
        })
        .join("");
  $("#lecture-references").innerHTML = (v.references || [])
    .map(
      (r) =>
        `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)} ↗</a>`,
    )
    .join(" · ");
  $("#personal-notes").value = read("drm-note-" + v.id, "");
  $("#personal-status").textContent = "";
  $("#lesson-course-links").innerHTML = C.filter((c) =>
    c.lectureIds.includes(v.id),
  )
    .map((c) => `<a href="#course/${c.id}">${esc(c.title)} ↗</a>`)
    .join("");
  const ids = courseContext?.lectureIds || V.map((v) => v.id),
    next = ids[ids.indexOf(v.id) + 1];
  $("#lesson-next").innerHTML = next
    ? `<a href="#lecture/${next}${courseContext ? "?course=" + courseContext.id : ""}">Next lecture<br><strong>${esc(byId.get(next).title)}</strong> →</a>`
    : '<p class="muted">You’ve reached the end of this learning path.</p>';
  document.title = v.title + " — Dr M";
}
$("#save-lecture").onclick = () => toggleLecture(lesson.id);
$("#complete-lecture").onclick = () => {
  done.has(lesson.id) ? done.delete(lesson.id) : done.add(lesson.id);
  write("drm-completed", [...done]);
  $("#complete-lecture").textContent = done.has(lesson.id)
    ? "✓ Completed"
    : "Mark complete";
  metrics();
  toast(
    done.has(lesson.id)
      ? "Lecture completed. Keep going!"
      : "Lecture marked as not completed.",
  );
};
$("#personal-notes").oninput = () => {
  $("#personal-status").textContent = write(
    "drm-note-" + lesson.id,
    $("#personal-notes").value,
  )
    ? "Saved on this browser"
    : "Storage unavailable. Copy your notes before leaving.";
};
$("#bank-subject").innerHTML += subjects
  .map((s) => `<option>${esc(s)}</option>`)
  .join("");
$("#bank-course").innerHTML += C.map(
  (c) => `<option value="${c.id}">${esc(c.title)}</option>`,
).join("");
$("#bank-lecture").innerHTML += V.map(v=>`<option value="${v.id}">${esc(v.title)}</option>`).join('');
function pool() {
  const s = $("#bank-subject").value,
    c = C.find((c) => c.id === $("#bank-course").value),
    p = $("#bank-pool").value,
    lecture = $("#bank-lecture").value,
    query = $("#bank-search").value.trim().toLowerCase();
  return Q.filter(
    (q) =>
      (s === "all" || q.category === s) &&
      (!c || q.lectureIds.some((id) => c.lectureIds.includes(id))) &&
      (lecture === 'all' || !lecture || q.lectureIds.includes(lecture)) &&
      (!query || `${q.title||''} ${q.prompt}`.toLowerCase().includes(query)) &&
      (p === "all" ||
        (p === "unseen" && !outcomes[q.id]) ||
        (p === "incorrect" && outcomes[q.id]?.correct === false) ||
        (p === "saved" && qSaved.has(q.id))),
  );
}
function updatePool() {
  const n = pool().length;
  const selectedLecture = byId.get($("#bank-lecture").value);
  $("#bank-lecture-context").hidden = !selectedLecture;
  $("#bank-lecture-context").innerHTML = selectedLecture ? `<a href="#lecture/${selectedLecture.id}">← Back to lecture</a><h2>${esc(selectedLecture.title)}</h2><p>${n} questions match your current filters for this lecture. Choose tutor or exam mode below.</p>` : "";
  $("#pool-count").textContent = n + " questions match your filters";
  $("#start-session").disabled = !n;
}
for (const id of ["bank-subject", "bank-course", "bank-pool", "bank-lecture"])
  $("#" + id).onchange = updatePool;
$("#bank-search").oninput = updatePool;
function setBankCourse(id) {
  $("#bank-course").value = id;
  $("#bank-subject").value = "all";
  $("#bank-pool").value = "all";
  $("#bank-lecture").value = "all";
  $("#bank-search").value = "";
  updatePool();
}
function bankStats() {
  const values = Object.values(outcomes),
    correct = values.filter((v) => v.correct).length;
  $("#bank-stats").innerHTML = [
    [Q.length, "questions available"],
    [values.length, "questions attempted"],
    [
      values.length ? Math.round((correct / values.length) * 100) + "%" : "—",
      "latest-answer accuracy",
    ],
    [qSaved.size, "bookmarked questions"],
  ]
    .map(
      ([n, label]) =>
        `<div class="bank-stat"><strong>${n}</strong><span>${label}</span></div>`,
    )
    .join("");
  $("#session-history").innerHTML = history.length
    ? history
        .slice(0, 5)
        .map(
          (h) =>
            `<div class="history-row"><div>${h.mode === "tutor" ? "Tutor" : "Exam"} session<small>${new Date(h.date).toLocaleDateString()} · ${h.total} questions</small></div><strong>${Math.round((h.score / h.total) * 100)}%</strong></div>`,
        )
        .join("")
    : '<p class="muted small">Your completed sessions will appear here. Start with a topic you’ve just studied.</p>';
}
function saveSession() {
  write("drm-q-session", session);
}
function remaining() {
  return session?.deadline
    ? Math.max(0, Math.ceil((session.deadline - Date.now()) / 1000))
    : (session?.remaining ?? 0);
}
function timeText(seconds) {
  return (
    String(Math.floor(seconds / 60)).padStart(2, "0") +
    ":" +
    String(seconds % 60).padStart(2, "0")
  );
}
function updateBank() {
  bankStats();
  if (lastResult)
    $("#session-history").innerHTML +=
      '<button class="button outline" data-action="last-result">Review last session</button>';
  updatePool();
  $("#bank-result").hidden = true;
  $("#bank-active").hidden = true;
  $("#bank-setup").hidden = false;
  $("#resume-banner").hidden = !session;
  if (session) {
    $("#resume-banner").innerHTML =
      `<span>You have an unfinished ${session.mode} session. ${Object.keys(session.answers).length}/${session.ids.length} answered.</span><button class="button" data-action="resume">Resume session →</button><button class="button outline" data-action="discard">Discard session</button>`;
  }
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function startSession(questions, options = {}) {
  if (!questions.length) {
    toast("No questions match this selection.");
    return;
  }
  const total =
    $("#bank-count").value === "all"
      ? questions.length
      : Number($("#bank-count").value);
  const ids = shuffle([...questions])
    .slice(0, options.all ? questions.length : total)
    .map((q) => q.id);
  const minutes = Number($("#bank-time").value);
  session = {
    ids,
    index: 0,
    answers: {},
    checked: [],
    flags: [],
    mode: options.mode || $("#bank-mode").value,
    started: Date.now(),
    timed: minutes > 0,
    deadline: minutes ? Date.now() + minutes * 60000 : null,
    remaining: minutes * 60,
    paused: false,
    options: Object.fromEntries(
      ids.map((id) => [id, shuffle([...qMap.get(id).options])]),
    ),
  };
  saveSession();
  renderSession();
}
$("#bank-form").onsubmit = (e) => {
  e.preventDefault();
  if (session) {
    toast("Resume or discard your unfinished session first.");
    return;
  }
  startSession(pool());
};
function renderSession() {
  if (!session) return;
  $("#bank-setup").hidden = true;
  $("#bank-result").hidden = true;
  $("#bank-active").hidden = false;
  if (session.paused) {
    $("#bank-active").innerHTML =
      '<section class="panel center"><h2>Session paused</h2><p class="muted">Take your time. Your answers are saved.</p><button class="button" data-action="resume">Continue session →</button><button class="button outline" data-action="setup">Back to question bank</button></section>';
    return;
  }
  const q = qMap.get(session.ids[session.index]),
    answer = session.answers[q.id],
    checked = session.mode === "tutor" && session.checked.includes(q.id);
  $("#bank-active").innerHTML =
    `<div class="session-top"><span class="eyebrow">${session.mode.toUpperCase()} MODE · QUESTION ${session.index + 1} OF ${session.ids.length}</span><div><span class="timer" id="session-timer">${session.timed ? timeText(remaining()) : "Untimed"}</span> <button class="button outline" data-action="pause">Pause</button></div></div><div class="session-layout"><section class="panel"><div class="panel-head"><span class="subject">${esc(q.category)}</span><button class="button outline" data-action="save-question" aria-pressed="${qSaved.has(q.id)}">${qSaved.has(q.id) ? "◆ Bookmarked" : "◇ Bookmark"}</button></div><h2 class="question-prompt">${esc(q.prompt)}</h2><div role="group" aria-label="Answer choices">${session.options[q.id].map((o, i) => `<button class="answer ${answer === o ? "selected" : ""} ${checked && o === q.answer ? "correct" : ""} ${checked && answer === o && o !== q.answer ? "wrong" : ""}" data-answer="${i}" aria-pressed="${answer === o}" ${checked ? "disabled" : ""}><b>${String.fromCharCode(65 + i)}</b><span>${esc(o)}</span></button>`).join("")}</div>${checked ? `<div class="feedback" role="status"><strong>${answer === q.answer ? "✓ Correct" : "Not quite — correct answer: " + esc(q.answer)}</strong><br>${esc(q.explanation)}${distractors(q)}${questionReferences(q)}<br><a href="#lecture/${q.lectureIds[0]}">Review the lecture ↗</a></div>` : ""}<div class="session-controls"><button class="button outline" data-action="previous" ${session.index === 0 ? "disabled" : ""}>← Previous</button><button class="button outline" data-action="flag" aria-pressed="${session.flags.includes(q.id)}">${session.flags.includes(q.id) ? "⚑ Flagged" : "⚐ Flag for review"}</button>${session.mode === "tutor" && !checked ? `<button class="button" data-action="check" ${answer === undefined ? "disabled" : ""}>Check answer</button>` : `<button class="button" data-action="${session.index === session.ids.length - 1 ? "finish-prompt" : "next"}">${session.index === session.ids.length - 1 ? "Finish session" : "Next question →"}</button>`}</div></section><aside class="panel"><h3>Session overview</h3><p class="small muted">${Object.keys(session.answers).length} answered · ${session.flags.length} flagged</p><div class="question-nav">${session.ids.map((id, i) => `<button data-question="${i}" class="${session.index === i ? "current" : ""} ${session.answers[id] !== undefined ? "answered" : ""} ${session.flags.includes(id) ? "flagged" : ""}" aria-label="Question ${i + 1}${session.flags.includes(id) ? ", flagged" : ""}${session.answers[id] !== undefined ? ", answered" : ""}">${i + 1}</button>`).join("")}</div><p class="small muted">Blue: answered · Underlined: flagged. Keyboard: 1–5 selects an answer.</p><button class="button outline" data-action="finish-prompt">Finish & review</button></aside></div>`;
}
function pauseSession() {
  if (!session || session.paused) return;
  if (session.timed) {
    session.remaining = remaining();
    session.deadline = null;
  }
  session.paused = true;
  saveSession();
}
function resumeSession() {
  if (!session) return;
  if (session.paused && session.timed)
    session.deadline = Date.now() + session.remaining * 1000;
  session.paused = false;
  saveSession();
  renderSession();
}
let lastResult = read("drm-q-last-result", null);
if (lastResult && (!Array.isArray(lastResult.results) || !lastResult.results.length || !lastResult.results.every((r) => r && qMap.has(r.id))))
  lastResult = null;
function finishSession(expired = false) {
  if (!session) return;
  const results = session.ids.map((id) => {
      const q = qMap.get(id);
      return {
        id,
        answer: session.answers[id] ?? null,
        correct: session.answers[id] === q.answer,
        flagged: session.flags.includes(id),
      };
    }),
    score = results.filter((r) => r.correct).length;
  for (const r of results)
    outcomes[r.id] = { correct: r.correct, date: new Date().toISOString() };
  lastResult = {
    results,
    score,
    total: results.length,
    mode: session.mode,
    expired,
  };
  history.unshift({
    score,
    total: results.length,
    mode: session.mode,
    date: new Date().toISOString(),
  });
  history = history.slice(0, 20);
  write("drm-q-history", history);
  write("drm-q-outcomes", outcomes);
  write("drm-q-last-result", lastResult);
  session = null;
  saveSession();
  reviewFilter = "all";
  renderResults();
  bankStats();
}
function renderResults() {
  if (!lastResult) return;
  $("#bank-setup").hidden = true;
  $("#bank-active").hidden = true;
  $("#bank-result").hidden = false;
  const r = lastResult,
    wrong = r.results.filter((q) => !q.correct);
  const review = r.results.filter(
    (q) =>
      reviewFilter === "all" ||
      (reviewFilter === "incorrect" && !q.correct) ||
      (reviewFilter === "flagged" && q.flagged),
  );
  $("#bank-result").innerHTML =
    `<section class="result-header"><div class="score-circle">${Math.round((r.score / r.total) * 100)}%</div><div><h2>${r.expired ? "Time is up." : "Session complete."}</h2><p>${r.score} correct · ${wrong.length} incorrect or unanswered · ${r.total} questions</p></div></section><div class="session-controls"><button class="button" data-action="new-session">Create another session</button><button class="button outline" data-action="retry-incorrect" ${wrong.length ? "" : "disabled"}>Retry ${wrong.length} missed questions</button></div><section class="panel" style="margin-top:24px"><div class="panel-head"><h2>Answer review</h2><select id="review-filter" aria-label="Filter answer review"><option value="all" ${reviewFilter === "all" ? "selected" : ""}>All questions</option><option value="incorrect" ${reviewFilter === "incorrect" ? "selected" : ""}>Incorrect / unanswered</option><option value="flagged" ${reviewFilter === "flagged" ? "selected" : ""}>Flagged</option></select></div>${
      review
        .map((item) => {
          const q = qMap.get(item.id);
          return `<article class="review-item"><span class="${item.correct ? "status-correct" : "status-wrong"}">${item.correct ? "✓ Correct" : item.answer === null ? "— Unanswered" : "✕ Incorrect"}</span><h3>${esc(q.prompt)}</h3><p>Your answer: <strong>${esc(item.answer ?? "Not answered")}</strong><br>Correct answer: <strong>${esc(q.answer)}</strong></p><p>${esc(q.explanation)}</p>${distractors(q)}${questionReferences(q)}<a class="small bank-link" href="#lecture/${q.lectureIds[0]}">Review related lecture ↗</a> <button class="button outline" data-bookmark-question="${q.id}">${qSaved.has(q.id) ? "◆ Bookmarked" : "◇ Bookmark"}</button></article>`;
        })
        .join("") || '<p class="muted">No questions in this review filter.</p>'
    }</section>`;
  $("#review-filter").onchange = (e) => {
    reviewFilter = e.target.value;
    renderResults();
  };
}
$("#bank-view").onclick = (e) => {
  const a = e.target.closest("[data-action]")?.dataset.action,
    b = e.target.closest("[data-answer]"),
    jump = e.target.closest("[data-question]"),
    bookmark = e.target.closest("[data-bookmark-question]");
  if (bookmark) {
    const id = bookmark.dataset.bookmarkQuestion;
    qSaved.has(id) ? qSaved.delete(id) : qSaved.add(id);
    write("drm-q-saved", [...qSaved]);
    renderResults();
    bankStats();
    return;
  }
  if (b && session) {
    const id = session.ids[session.index];
    session.answers[id] = session.options[id][Number(b.dataset.answer)];
    saveSession();
    renderSession();
    return;
  }
  if (jump && session) {
    session.index = Number(jump.dataset.question);
    saveSession();
    renderSession();
    return;
  }
  if (!a) return;
  if (a === "last-result") {
    renderResults();
    return;
  }
  if (a === "resume") {
    resumeSession();
    return;
  }
  if (a === "discard") {
    session = null;
    saveSession();
    updateBank();
    return;
  }
  if (a === "setup" || a === "new-session") {
    pauseSession();
    updateBank();
    return;
  }
  if (a === "retry-incorrect") {
    startSession(
      lastResult.results.filter((r) => !r.correct).map((r) => qMap.get(r.id)),
      { all: true, mode: "tutor" },
    );
    return;
  }
  if (!session) return;
  const id = session.ids[session.index],
    q = qMap.get(id);
  if (a === "check") {
    if (session.answers[id] === undefined) return;
    if (!session.checked.includes(id)) session.checked.push(id);
    outcomes[id] = {
      correct: session.answers[id] === q.answer,
      date: new Date().toISOString(),
    };
    write("drm-q-outcomes", outcomes);
  }
  if (a === "next")
    session.index = Math.min(session.index + 1, session.ids.length - 1);
  if (a === "previous") session.index = Math.max(session.index - 1, 0);
  if (a === "flag")
    session.flags.includes(id)
      ? (session.flags = session.flags.filter((x) => x !== id))
      : session.flags.push(id);
  if (a === "save-question") {
    qSaved.has(id) ? qSaved.delete(id) : qSaved.add(id);
    write("drm-q-saved", [...qSaved]);
  }
  if (a === "pause") pauseSession();
  if (a === "finish-prompt") {
    const unanswered = session.ids.length - Object.keys(session.answers).length;
    $("#bank-active").innerHTML =
      `<section class="panel center"><h2>Ready to finish?</h2><p>${unanswered} unanswered question${unanswered === 1 ? "" : "s"} will be counted as incorrect.</p><button class="button" data-action="submit">Finish & see results</button> <button class="button outline" data-action="continue">Keep practicing</button></section>`;
    return;
  }
  if (a === "submit") {
    finishSession();
    return;
  }
  saveSession();
  renderSession();
};
setInterval(() => {
  if (!session || session.paused || !session.timed) return;
  const left = remaining();
  const timer = $("#session-timer");
  if (timer) timer.textContent = timeText(left);
  if (left === 0) {
    finishSession(true);
    toast("Time is up. Your session has been scored.");
  }
}, 1000);
function route() {
  const parts = location.hash.slice(1).split("/"),
    kind = parts[0] || "library";
  if (kind !== "bank") pauseSession();
  for (const el of document.querySelectorAll(".view")) el.hidden = true;
  for (const a of document.querySelectorAll("[data-nav]"))
    { const active =
      a.dataset.nav ===
        (kind === "course" ? "courses" : kind === "lecture" ? "library" : kind);
    a.setAttribute('aria-current', active ? 'page' : 'false');
    a.classList.toggle(
      "active",
      active,
    );
    }
  if (kind !== "lecture") {
    $("#video-player").innerHTML = "";
    lesson = null;
  }
  document.title = "Dr M | Medical learning, made clear";
  if (kind === "lecture") {
    const [id, query] = String(parts[1]).split("?"),
      v = byId.get(id);
    if (v) {
      $("#lesson-view").hidden = false;
      openLesson(v, new URLSearchParams(query).get("course"));
    } else {
      $("#library-view").hidden = false;
      renderLibrary();
    }
  } else if (kind === "course") {
    const c = C.find((c) => c.id === parts[1]);
    if (c) {
      $("#course-view").hidden = false;
      openCourse(c);
    } else {
      $("#courses-view").hidden = false;
      renderCourses();
    }
  } else if (kind === "courses") {
    $("#courses-view").hidden = false;
    renderCourses();
  } else if (kind === "flashcards") {
    $("#flashcards-view").hidden = false;
    window.renderFlashcards?.(parts[1]);
  } else if (kind === "bank") {
    $("#bank-view").hidden = false;
    if (byId.has(parts[1])) {
      $("#bank-subject").value = "all";
      $("#bank-course").value = "all";
      $("#bank-pool").value = "all";
      $("#bank-lecture").value = parts[1];
      $("#bank-search").value = "";
    }
    updateBank();
  } else {
    $("#library-view").hidden = false;
    renderLibrary();
  }
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
window.addEventListener("beforeunload", saveSession);
document.addEventListener("keydown", (e) => {
  if (
    e.key === "/" &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName) &&
    !$("#library-view").hidden
  ) {
    e.preventDefault();
    $("#lecture-search").focus();
  }
});
metrics();
updatePool();
route();

$("#lecture-notes").onclick = (e) => {
  const practice = e.target.closest('a[href*="#bank/"],a[href*="#flashcards/"]');
  if (practice) {
    e.preventDefault();
    location.hash = practice.getAttribute('href').split('#')[1];
    return;
  }
  const b = e.target.closest("[data-scroll-note]");
  if (b) {
    e.preventDefault();
    const target = document.getElementById(b.dataset.scrollNote);
    if (target?.tagName === "DETAILS") target.open = true;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};
$("#focus-reading").onclick = () => {
  document.body.classList.toggle("reading-focus");
  $("#focus-reading").textContent = document.body.classList.contains(
    "reading-focus",
  )
    ? "Exit focus reading"
    : "Focus reading";
};
$("#print-notes").onclick = () => window.print();

function distractors(q) {
  return q.distractorExplanations
    ? '<details class="answer-reasons"><summary>Why the other options are incorrect</summary>' +
        Object.entries(q.distractorExplanations)
          .filter(([o]) => o !== q.answer)
          .map(
            ([o, t]) =>
              "<p><strong>" + esc(o) + "</strong>: " + esc(t) + "</p>",
          )
          .join("") +
        "</details>"
    : "";
}

function questionReferences(q){return q.references?.length ? `<details class="answer-reasons"><summary>Sources and further reading</summary><ul>${q.references.map(r=>`<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)}</a></li>`).join("")}</ul></details>` : "";}
document.addEventListener("keydown",e=>{if(!session||session.paused||$("#bank-view").hidden||["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)||e.ctrlKey||e.altKey||e.metaKey)return;if(/^[1-5]$/.test(e.key)){const b=document.querySelector(`[data-answer="${Number(e.key)-1}"]`);if(b&&!b.disabled){e.preventDefault();b.click();}}});
