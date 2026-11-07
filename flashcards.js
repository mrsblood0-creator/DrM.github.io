/* Browser-local spaced-repetition study. Content is provided by LIBRARY.flashcards. */
(() => {
  "use strict";
  const el = (s) => document.querySelector(s),
    lib = window.LIBRARY,
    lectures = new Map(lib.videos.map((v) => [v.id, v]));
  const escape = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const load = (k, f) => {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? f;
    } catch {
      return f;
    }
  };
  let saved = load("drm-flash-v1", {
      states: {},
      edits: {},
      custom: [],
      logs: [],
      newLimit: 20,
    }),
    active = load("drm-flash-session", null),
    undo = null,
    editId = null,
    browseLimit = 20;
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) saved = {};
  for (const key of ['states','edits']) {
    if (!saved[key] || typeof saved[key] !== 'object' || Array.isArray(saved[key])) saved[key] = {};
  }
  for (const key of ['custom','logs']) if (!Array.isArray(saved[key])) saved[key] = [];
  if (active && (typeof active !== 'object' || !Array.isArray(active.queue))) active = null;
  if (active) {
    active.queue = active.queue.filter(id => typeof id === 'string');
    active.learning = Array.isArray(active.learning) ? active.learning.filter(id => typeof id === 'string') : [];
    active.reviewed = Number.isFinite(active.reviewed) ? Math.max(0,active.reviewed) : 0;
  }
  for (const [k, v] of Object.entries({
    states: {},
    edits: {},
    custom: [],
    logs: [],
    newLimit: 20,
  }))
    if (saved[k] === undefined) saved[k] = v;
  const day = 86400000,
    minute = 60000,
    today = () => new Date().toLocaleDateString("en-CA"),
    tomorrow = () => {
      const d = new Date();
      d.setHours(24, 0, 0, 0);
      return +d;
    };
  function persist() {
    try {
      localStorage.setItem("drm-flash-v1", JSON.stringify(saved));
      localStorage.setItem("drm-flash-session", JSON.stringify(active));
      return true;
    } catch {
      el("#flash-import-status").textContent =
        "Storage unavailable. Export a backup before leaving.";
      return false;
    }
  }
  function cards() {
    return [...(lib.flashcards || []), ...saved.custom].map((c) => ({
      ...c,
      ...saved.edits[c.id],
    }));
  }
  const state = (id) =>
    saved.states[id] || {
      stage: "new",
      due: 0,
      interval: 0,
      ease: 2.5,
      reps: 0,
      lapses: 0,
    };
  function schedule(old, grade, now = Date.now()) {
    const s = { ...old, ease: old.ease || 2.5, reps: (old.reps || 0) + 1 };
    if (grade === 1) {
      s.stage = "learning";
      s.step = 0;
      s.due = now + minute;
      if (old.stage === "review") {
        s.lapses = (s.lapses || 0) + 1;
        s.ease = Math.max(1.3, s.ease - 0.2);
      }
    } else if (old.stage !== "review") {
      if (grade === 2) {
        s.stage = "learning";
        s.due = now + 6 * minute;
      } else if (grade === 3 && !(old.step >= 1)) {
        s.stage = "learning";
        s.step = 1;
        s.due = now + 10 * minute;
      } else {
        s.stage = "review";
        s.interval = grade === 4 ? 4 : 1;
        s.due = now + s.interval * day;
        s.step = 0;
      }
    } else {
      if (grade === 2) {
        s.interval = Math.max(1, Math.ceil((old.interval || 1) * 1.2));
        s.ease = Math.max(1.3, s.ease - 0.15);
      }
      if (grade === 3)
        s.interval = Math.max(1, Math.round((old.interval || 1) * s.ease));
      if (grade === 4) {
        s.interval = Math.max(
          2,
          Math.round((old.interval || 1) * s.ease * 1.3),
        );
        s.ease += 0.15;
      }
      s.due = now + s.interval * day;
    }
    return s;
  }
  function intervalLabel(s) {
    const n = s.due - Date.now();
    return n < day
      ? Math.max(1, Math.round(n / minute)) + " min"
      : Math.round(n / day) + " days";
  }
  function matches(c) {
    const v = lectures.get(c.lectureId),
      course = el("#flash-course").value,
      subject = el("#flash-subject").value;
    return (
      (course === "all" || v?.courseIds?.includes(course)) &&
      (subject === "all" || v?.category === subject) &&
      (el("#flash-lecture").value === "all" || el("#flash-lecture").value === c.lectureId)
    );
  }
  function eligible() {
    const now = Date.now(),
      mode = el("#flash-pool").value,
      list = cards()
        .filter(matches)
        .filter(
          (c) => !state(c.id).suspended && !(state(c.id).buriedUntil > now),
        );
    if (mode === "all") return list;
    let allowance = Math.max(
      0,
      saved.newLimit -
        saved.logs.filter((l) => l.day === today() && l.wasNew).length,
    );
    return list
      .filter((c) => {
        const s = state(c.id);
        if (s.stage === "new") return mode !== "review" && allowance-- > 0;
        return mode !== "new" && s.due <= now;
      })
      .sort(
        (a, b) =>
          Number(state(a.id).stage === "new") -
            Number(state(b.id).stage === "new") ||
          state(a.id).due - state(b.id).due,
      );
  }
  function stats() {
    const all = cards(),
      log = saved.logs.filter((l) => l.day === today()),
      due = all.filter((c) => {
        const s = state(c.id);
        return (
          s.stage !== "new" &&
          s.due <= Date.now() &&
          !s.suspended &&
          !(s.buriedUntil > Date.now())
        );
      }).length;
    el("#flash-stats").innerHTML = [
      [all.length, "cards in your collection"],
      [due, "reviews due now"],
      [log.length, "reviews today"],
      [
        log.length
          ? Math.round(
              (log.filter((l) => l.grade > 1).length / log.length) * 100,
            ) + "%"
          : "—",
        "recall today",
      ],
    ]
      .map(
        ([n, l]) =>
          `<div class="bank-stat"><strong>${n}</strong><span>${l}</span></div>`,
      )
      .join("");
  }
  function updateEligible() {
    const n = eligible().length;
    el("#flash-eligible").textContent = n + " cards ready for this session";
    el("#flash-start").disabled = n === 0;
  }
  function browser() {
    const query = el("#flash-search").value.trim().toLowerCase(),
      list = cards()
        .filter(matches)
        .filter((c) => (c.front + " " + c.back).toLowerCase().includes(query));
    el("#flash-browser").innerHTML =
      list
        .slice(0, browseLimit)
        .map((c) => {
          const s = state(c.id);
          return `<article class="flash-row"><div><strong>${escape(c.front)}</strong><small>${escape(lectures.get(c.lectureId)?.title || "Personal card")} · ${s.suspended ? "Suspended" : s.buriedUntil > Date.now() ? "Buried until tomorrow" : s.stage === "new" ? "New" : new Date(s.due).toLocaleString()}</small></div><div class="flash-row-actions"><button data-fc-edit="${c.id}">Edit</button><button data-fc-suspend="${c.id}">${s.suspended ? "Restore" : "Suspend"}</button><button data-fc-reset="${c.id}">Reset</button>${c.id.startsWith("custom-") ? `<button data-fc-delete="${c.id}">Delete</button>` : ""}</div></article>`;
        })
        .join("") || "<p>No matching cards.</p>";
    el("#flash-more").hidden = list.length <= browseLimit;
  }
  function render() {
    const lectureId = el('#flash-lecture').value;
    const lecture = lectures.get(lectureId);
    el('#flash-lecture-context').hidden = !lecture;
    el('#flash-lecture-context').innerHTML = lecture ? `<a href="#lecture/${lecture.id}">← Back to lecture</a><h2>${escape(lecture.title)}</h2><p>${cards().filter(c=>c.lectureId===lectureId).length} flashcards for this lecture. Study due cards or use preview to browse without changing your schedule.</p>` : '';
    stats();
    updateEligible();
    browser();
    el("#flash-setup").hidden = false;
    el("#flash-study").hidden = true;
    el("#flash-resume").innerHTML = active
      ? '<div class="resume-banner">Your study session is saved.<button class="button" data-fc-action="resume">Resume</button><button class="button outline" data-fc-action="end">End session</button></div>'
      : "";
  }
  function study() {
    el("#flash-setup").hidden = true;
    el("#flash-study").hidden = false;
    if (!active) return render();
    const map = new Map(cards().map((c) => [c.id, c]));
    active.learning ||= [];
    active.learning = active.learning.filter(id => map.has(id) && !state(id).suspended && !(state(id).buriedUntil > Date.now()));
    const ready = active.learning.filter(id => state(id).due <= Date.now());
    active.queue.unshift(...ready.filter(id => !active.queue.includes(id)));
    active.learning = active.learning.filter(id => !ready.includes(id));
    while (
      active.queue.length &&
      (!map.has(active.queue[0]) || state(active.queue[0]).suspended || state(active.queue[0]).buriedUntil > Date.now())
    )
      active.queue.shift();
    persist();
    if (!active.queue.length) {
      el("#flash-study").innerHTML =
        `<section class="panel center"><div class="eyebrow">${active.learning.length ? 'LEARNING BREAK' : 'SESSION FINISHED'}</div><h2>You reviewed ${active.reviewed} cards.</h2><p>${active.learning.length ? `${active.learning.length} learning cards will return here when due. Next review: ${new Date(Math.min(...active.learning.map(id=>state(id).due))).toLocaleTimeString()}.` : 'Your scheduled reviews are saved.'}</p><button class="button" data-fc-action="end">Back to flashcards</button>${undo ? '<button class="button outline" data-fc-action="undo">Undo last rating</button>' : ""}</section>`;
      stats();
      return;
    }
    const c = map.get(active.queue[0]),
      s = state(c.id);
    el("#flash-study").innerHTML =
      `<div class="session-top"><span>${active.reviewed} reviewed · ${active.queue.length} remaining${active.preview ? " · PREVIEW" : ""}</span><button class="button outline" data-fc-action="pause">Save & exit</button></div><section class="flash-card panel"><div class="panel-head"><span class="subject">${escape(lectures.get(c.lectureId)?.category || "Personal deck")}</span><span>${escape(s.stage)}</span></div><span class="eyebrow">RECALL BEFORE REVEALING</span><h2>${escape(c.front)}</h2>${active.revealed ? `<div class="flash-answer"><span class="eyebrow">ANSWER</span><p>${escape(c.back)}</p><div class="flash-explanation">${escape(c.explanation || "")}</div>${lectures.has(c.lectureId) ? `<a href="#lecture/${c.lectureId}" class="bank-link">Review the related lecture ↗</a>` : ""}</div>` : '<button class="button" data-fc-action="reveal">Show answer <kbd>Space</kbd></button>'}</section>${active.revealed ? `<div class="flash-ratings">${active.preview ? '<button class="button" data-fc-action="preview-next">Next card →</button>' : [1, 2, 3, 4].map((grade, i) => `<button data-fc-grade="${grade}" class="rating rating-${grade}"><small>${grade}</small><strong>${["Again", "Hard", "Good", "Easy"][i]}</strong><span>${intervalLabel(schedule(s, grade))}</span></button>`).join("")}</div>` : ""}<div class="session-controls"><button class="button outline" data-fc-action="undo" ${undo ? "" : "disabled"}>Undo last rating</button><button class="button outline" data-fc-action="bury">Bury until tomorrow</button><button class="button outline" data-fc-action="suspend">Suspend card</button><button class="button outline" data-fc-edit="${c.id}">Edit card</button></div><p class="small muted center">Space: reveal · 1–4: rate · U: undo. Ratings reflect your recall, not a test score.</p>`;
  }
  function start() {
    if (active) {
      el("#flash-import-status").textContent =
        "Resume or end the saved session first.";
      return;
    }
    const n = el("#flash-count").value;
    active = {
      queue: eligible()
        .slice(0, n === "all" ? undefined : Number(n))
        .map((c) => c.id),
      reviewed: 0,
      learning: [],
      revealed: false,
      preview: el("#flash-pool").value === "all",
    };
    undo = null;
    study();
  }
  function rate(grade) {
    if (!active?.revealed || active.preview || !active.queue.length) return;
    const id = active.queue[0],
      s = state(id);
    undo = {
      id,
      previous: saved.states[id] ? { ...s } : null,
      session: JSON.parse(JSON.stringify(active)),
      logs: [...saved.logs],
    };
    saved.states[id] = schedule(s, grade);
    saved.logs.push({
      id,
      grade,
      day: today(),
      at: Date.now(),
      wasNew: s.stage === "new",
    });
    saved.logs = saved.logs.slice(-10000);
    active.queue.shift();
    if (saved.states[id].stage === 'learning') {
      active.learning ||= [];
      if (!active.learning.includes(id)) active.learning.push(id);
    }
    active.reviewed++;
    active.revealed = false;
    persist();
    study();
  }
  function edit(id = null) {
    editId = id;
    const c = cards().find((c) => c.id === id) || {};
    el("#flash-editor-title").textContent = id ? "Edit card" : "Create a card";
    el("#flash-edit-front").value = c.front || "";
    el("#flash-edit-back").value = c.back || "";
    el("#flash-edit-explanation").value = c.explanation || "";
    el("#flash-edit-lecture").value = c.lectureId || "";
    el("#flash-editor").showModal();
  }
  function download(name, data, type) {
    const url = URL.createObjectURL(new Blob([data], { type })),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function parseCSV(text) {
    const rows = [];
    let row = [],
      value = "",
      quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (quoted && text[i + 1] === '"') {
          value += '"';
          i++;
        } else quoted = !quoted;
      } else if (c === "," && !quoted) {
        row.push(value);
        value = "";
      } else if (c === "\n" && !quoted) {
        row.push(value.replace(/\r$/, ""));
        rows.push(row);
        row = [];
        value = "";
      } else value += c;
    }
    if (value || row.length) {
      row.push(value);
      rows.push(row);
    }
    if (quoted) throw Error("CSV contains an unclosed quote.");
    return rows;
  }
  function normalizeCard(c, i) {
    if (!c || typeof c !== 'object') throw Error('Invalid card record.');
    if (['__proto__','prototype','constructor'].includes(c.id)) throw Error('Invalid card ID.');
    if (typeof c.lectureId === 'string' && c.lectureId.includes('/lectures/')) c.lectureId = c.lectureId.split('/lectures/')[1].split('/')[0];
    if (
      typeof c.front !== "string" ||
      typeof c.back !== "string" ||
      !c.front.trim() ||
      !c.back.trim()
    )
      throw Error("Every card needs a question and answer.");
    if (c.front.length > 2000 || c.back.length > 5000)
      throw Error("Card text is too long.");
    return {
      id:
        typeof c.id === "string" && /^[\w-]{1,100}$/.test(c.id)
          ? c.id
          : "custom-" + Date.now() + "-" + i,
      front: c.front.trim(),
      back: c.back.trim(),
      explanation: String(c.explanation || "").slice(0, 5000),
      lectureId: lectures.has(c.lectureId) ? c.lectureId : "",
    };
  }
  el("#flash-lecture").innerHTML += lib.videos.map(v=>`<option value="${v.id}">${escape(v.title)}</option>`).join("");
  window.renderFlashcards = (lectureId) => {
    if (lectures.has(lectureId)) {
      el("#flash-course").value = "all";
      el("#flash-subject").value = "all";
      el("#flash-pool").value = "all";
      el("#flash-lecture").value = lectureId;
      el("#flash-search").value = "";
    }
    render();
  };
  window.FlashcardScheduler = { schedule, parseCSV };
  setInterval(() => {
    if (active?.learning?.length && !active.queue.length && !el('#flash-study').hidden && !el('#flashcards-view').hidden) study();
  }, 1000);
  el("#flash-course").innerHTML += lib.courses
    .map((c) => `<option value="${c.id}">${escape(c.title)}</option>`)
    .join("");
  el("#flash-subject").innerHTML += [
    ...new Set(lib.videos.map((v) => v.category)),
  ]
    .sort()
    .map((c) => `<option>${escape(c)}</option>`)
    .join("");
  el("#flash-edit-lecture").innerHTML =
    '<option value="">Personal deck</option>' +
    lib.videos
      .map((v) => `<option value="${v.id}">${escape(v.title)}</option>`)
      .join("");
  el("#flash-new-limit").value = saved.newLimit;
  for (const id of ["flash-course", "flash-subject", "flash-pool", "flash-lecture"])
    el("#" + id).onchange = () => {
      browseLimit = 20;
      updateEligible();
      browser();
    };
  el("#flash-new-limit").onchange = () => {
    saved.newLimit = Math.min(
      200,
      Math.max(1, Number(el("#flash-new-limit").value) || 20),
    );
    el("#flash-new-limit").value = saved.newLimit;
    persist();
    updateEligible();
  };
  el("#flash-search").oninput = () => {
    browseLimit = 20;
    browser();
  };
  el("#flash-more").onclick = () => {
    browseLimit += 20;
    browser();
  };
  el("#flash-start").onclick = start;
  el("#flash-add").onclick = () => edit();
  el("#flash-edit-cancel").onclick = () => el("#flash-editor").close();
  el("#flash-edit-form").onsubmit = (e) => {
    e.preventDefault();
    const c = normalizeCard(
      {
        id: editId || "custom-" + Date.now(),
        front: el("#flash-edit-front").value,
        back: el("#flash-edit-back").value,
        explanation: el("#flash-edit-explanation").value,
        lectureId: el("#flash-edit-lecture").value,
      },
      0,
    );
    if (editId) saved.edits[editId] = c;
    else saved.custom.push(c);
    persist();
    el("#flash-editor").close();
    if (active && !el("#flash-study").hidden) study();
    else render();
  };
  el("#flash-export").onclick = () =>
    download(
      "dr-m-flashcards-backup.json",
      JSON.stringify({ version: 1, cards: cards(), progress: saved }, null, 2),
      "application/json",
    );
  el("#flash-csv").onclick = () => {
    const quote = (s) => '"' + String(s).replace(/"/g, '""') + '"';
    download(
      "dr-m-flashcards-anki.csv",
      [
        ["Front", "Back", "Explanation", "Lecture"],
        ...cards().map((c) => [
          c.front,
          c.back,
          c.explanation || "",
          c.lectureId
            ? "https://www.drmcourses.com/lectures/" + c.lectureId + "/"
            : "",
        ]),
      ]
        .map((row) => row.map(quote).join(","))
        .join("\r\n"),
      "text/csv;charset=utf-8",
    );
  };
  el("#flash-import").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.size > 10000000) throw Error("Use a file smaller than 10 MB.");
      const text = await file.text();
      let data, imported;
      if (file.name.toLowerCase().endsWith(".csv")) {
        const rows = parseCSV(text);
        if (rows[0]?.[0]?.toLowerCase() === "front") rows.shift();
        imported = rows
          .filter((r) => r.some(Boolean))
          .map((r, i) =>
            normalizeCard(
              {
                front: r[0],
                back: r[1],
                explanation: r[2] || "",
                lectureId: r[3] || "",
              },
              i,
            ),
          );
      } else {
        data = JSON.parse(text);
        const raw = Array.isArray(data) ? data : data.cards;
        if (!Array.isArray(raw)) throw Error("Expected a cards array.");
        imported = raw.map(normalizeCard);
      }
      if (imported.length > 10000)
        throw Error("Maximum 10,000 cards per import.");
      if (
        !confirm(
          `Import ${imported.length} cards? Matching card IDs will be updated.${data?.progress ? " The backup also contains review progress." : ""}`,
        )
      )
        return;
      const built = new Set((lib.flashcards || []).map((c) => c.id));
      for (const c of imported) {
        if (built.has(c.id)) saved.edits[c.id] = c;
        else {
          const index = saved.custom.findIndex((x) => x.id === c.id);
          if (index >= 0) saved.custom[index] = c;
          else saved.custom.push(c);
        }
      }
      if (
        data?.progress &&
        confirm("Restore review dates and history from this backup?")
      ) {
        const p = data.progress;
        for (const [id, s] of Object.entries(p.states || {}))
          if (
            cards().some((c) => c.id === id) &&
            ["new", "learning", "review"].includes(s.stage) &&
            Number.isFinite(s.due)
          )
            saved.states[id] = {
              stage: s.stage,
              due: s.due,
              interval: Math.max(0, Number(s.interval) || 0),
              ease: Math.max(1.3, Number(s.ease) || 2.5),
              reps: Number(s.reps) || 0,
              lapses: Number(s.lapses) || 0,
              step: Number(s.step) || 0,
              suspended: !!s.suspended,
              buriedUntil: Number(s.buriedUntil) || 0,
            };
        if (Array.isArray(p.logs))
          saved.logs = p.logs
            .filter(
              (l) =>
                l &&
                typeof l.id === "string" &&
                Number.isInteger(l.grade) &&
                l.grade >= 1 &&
                l.grade <= 4,
            )
            .slice(-10000);
      }
      active = null;
      undo = null;
      persist();
      render();
      el("#flash-import-status").textContent =
        `Imported ${imported.length} cards.`;
    } catch (err) {
      el("#flash-import-status").textContent = err.message;
    }
    e.target.value = "";
  };
  el("#flashcards-view").onclick = (e) => {
    const target = e.target.closest(
      "[data-fc-action],[data-fc-grade],[data-fc-edit],[data-fc-suspend],[data-fc-reset],[data-fc-delete]",
    );
    if (!target) return;
    const d = target.dataset;
    if (d.fcGrade) {
      rate(Number(d.fcGrade));
      return;
    }
    if (d.fcEdit) {
      edit(d.fcEdit);
      return;
    }
    if (d.fcSuspend) {
      undo = null;
      saved.states[d.fcSuspend] = {
        ...state(d.fcSuspend),
        suspended: !state(d.fcSuspend).suspended,
      };
      persist();
      render();
      return;
    }
    if (d.fcReset && confirm("Reset this card to new?")) {
      undo = null;
      delete saved.states[d.fcReset];
      persist();
      render();
      return;
    }
    if (d.fcDelete && confirm("Delete this personal card?")) {
      undo = null;
      saved.custom = saved.custom.filter((c) => c.id !== d.fcDelete);
      delete saved.edits[d.fcDelete];
      delete saved.states[d.fcDelete];
      persist();
      render();
      return;
    }
    const action = d.fcAction;
    if (action === "end") {
      active = null;
      undo = null;
      persist();
      render();
    }
    if (action === "resume") study();
    if (action === "pause") render();
    if (action === "reveal" && active) {
      active.revealed = true;
      study();
    }
    if (action === "preview-next" && active) {
      active.queue.shift();
      active.reviewed++;
      active.revealed = false;
      study();
    }
    if (action === "undo" && undo) {
      if (undo.previous) saved.states[undo.id] = undo.previous;
      else delete saved.states[undo.id];
      active = undo.session;
      saved.logs = undo.logs;
      undo = null;
      persist();
      study();
    }
    if (["bury", "suspend"].includes(action) && active?.queue.length) {
      undo = null;
      const id = active.queue.shift();
      saved.states[id] = {
        ...state(id),
        ...(action === "bury"
          ? { buriedUntil: tomorrow() }
          : { suspended: true }),
      };
      active.revealed = false;
      persist();
      study();
    }
  };
  document.addEventListener("keydown", (e) => {
    if (
      el("#flashcards-view").hidden ||
      el("#flash-study").hidden ||
      el("#flash-editor").open ||
      ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(
        document.activeElement.tagName,
      )
    )
      return;
    if (e.code === "Space" && active && !active.revealed) {
      e.preventDefault();
      active.revealed = true;
      study();
    } else if (/^[1-4]$/.test(e.key)) {
      e.preventDefault();
      rate(Number(e.key));
    } else if (e.key.toLowerCase() === "u")
      el('[data-fc-action="undo"]')?.click();
  });
  if (location.hash.split('/')[0] === "#flashcards") window.renderFlashcards(location.hash.split('/')[1]);
})();
