import fs from "node:fs";
import vm from "node:vm";
import path from 'node:path';
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync("library-data.js", "utf8"), ctx);
const d = ctx.window.LIBRARY,
  site = JSON.parse(fs.readFileSync("content/site.json"));
const base = site.url.replace(/\/$/, "");
const E = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const pages = [];
const header = `<header class="topbar"><a class="brand" href="/"><img class="brand-logo" src="/images/logo.png" alt="Dr M home" width="112" height="112"></a><nav aria-label="Main navigation"><a href="/lectures/">Lecture library</a><a href="/courses/">Medical courses</a><a href="/questions/">Question bank</a><a href="/#flashcards">Flashcards</a></nav><a class="channel-link" href="https://www.youtube.com/@Dr.M.Courses" target="_blank" rel="noopener">Visit YouTube ↗</a></header>`;
function page(route, title, description, body, schema = {}) {
  const url = base + route;
  const meta = { ...schema, "@context": "https://schema.org", url };
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${E(title)} | Dr M</title><meta name="description" content="${E(description.slice(0, 170))}"><link rel="canonical" href="${E(url)}"><meta property="og:title" content="${E(title)}"><meta property="og:description" content="${E(description.slice(0, 170))}"><meta property="og:type" content="article"><meta property="og:url" content="${E(url)}"><link rel="stylesheet" href="/academy.css"><link rel="stylesheet" href="/brand-theme.css"><link rel="icon" type="image/png" href="/images/logo.png"><meta property="og:image" content="${E(base)}/images/banner.jpg"><script defer src="/article.js"></script><script defer src="/notes-tools.js"></script><script type="application/ld+json">${JSON.stringify(meta).replace(/</g, "\\u003c")}</script></head><body>${header}<main class="view">${body}</main><footer><a class="brand" href="/"><img class="brand-logo" src="/images/logo.png" alt="Dr M home" width="112" height="112"></a><a href="/lectures/">Lecture notes</a><a href="/courses/">Courses</a><a href="/questions/pathology-usmle-questions/">Pathology USMLE-style questions</a><span id="copyright">© ${new Date().getFullYear()}. All rights reserved.</span></footer></body></html>`;
  const folder = "dist" + route;
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(folder + "index.html", html);
  pages.push(route);
}
const byId = new Map(d.videos.map((v) => [v.id, v]));
for (const v of d.videos) {
  const refs = (v.references || [])
    .map(
      (r) =>
        `<li><a href="${E(r.url)}" rel="noopener" target="_blank">${E(r.title)}</a></li>`,
    )
    .join("");
  const notes = v.notesHtml
    .replace(
      /(src|href)="(illustrations|slide-assets|video-frames)\//g,
      '$1="/$2/',
    )
    .replace(/href="#lecture\/([^"?]+)[^"]*"/g, 'href="/lectures/$1/"');
  page(
    "/lectures/" + v.id + "/",
    v.title + " — lecture notes",
    `Study ${v.title}. ${v.notesDisabled ? "Video and related practice." : "Video and selectable presentation text with an outline and related practice."}`,
    `<a class="back" href="/lectures/">← Lecture library</a><div class="static-layout"><article><div class="eyebrow">${E(v.category)}</div><h1 class="static-title">${E(v.title)}</h1><p class="muted">${E(v.noteStatus)}${v.notesDisabled ? "" : " · "+v.readingMinutes+" min read"}</p><iframe class="static-video" loading="lazy" src="https://www.youtube-nocookie.com/embed/${v.id}" title="${E(v.title)}" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><p><a class="button" href="/#lecture/${v.id}">Open study tools</a></p><div class="prose">${notes}</div></article><aside class="static-toc"><strong>Related learning</strong>${d.courses
      .filter((c) => c.lectureIds.includes(v.id))
      .map((c) => `<a href="/courses/${c.id}/">${E(c.title)}</a>`)
      .join(
        "",
      )}<a href="/#flashcards/${v.id}">Lecture flashcards</a><a href="/#bank/${v.id}">Lecture questions</a></aside></div>`,
    {
      "@type": "LearningResource",
      name: v.title,
      learningResourceType: "Lecture notes",
      inLanguage: "en",
      isAccessibleForFree: true,
      provider: { "@type": "Organization", name: site.name },
      about: v.category,
    },
  );
}
const directory = (list) =>
  '<ul class="directory-list">' +
  list
    .map(
      (v) =>
        `<li><a href="/lectures/${v.id}/">${E(v.title)}</a><small>${E(v.category)} · ${E(v.noteStatus)}</small></li>`,
    )
    .join("") +
  "</ul>";
page(
  "/lectures/",
  "Medical lecture notes and videos",
  "Browse full-length medical lectures with source notes, diagrams and study explanations.",
  '<h1 class="static-title">Medical lecture library</h1><p>Browse by subject or use the <a href="/#library">searchable library</a>.</p>' +
    [...new Set(d.videos.map((v) => v.category))]
      .map(
        (cat) =>
          "<h2>" +
          E(cat) +
          "</h2>" +
          directory(d.videos.filter((v) => v.category === cat)),
      )
      .join(""),
  { "@type": "CollectionPage", name: "Medical lecture library" },
);
for (const c of d.courses)
  page(
    "/courses/" + c.id + "/",
    c.title,
    `Study ${c.title} in order with ${c.lectureIds.length} full lectures, notes and learning tools.`,
    `<a class="back" href="/courses/">← Courses</a><h1 class="static-title">${E(c.title)}</h1><p>${E(c.description)}</p>${c.playlistUrl ? `<p><a href="${E(c.playlistUrl)}">Source YouTube playlist</a> · Order imported from the published playlist.</p>` : ""}<ol class="directory-list">${c.lectureIds.map((id, i) => `<li>${i + 1}. <a href="/lectures/${id}/">${E(byId.get(id).title)}</a></li>`).join("")}</ol>`,
    {
      "@type": "Course",
      name: c.title,
      description: c.description,
      provider: { "@type": "Organization", name: site.name },
    },
  );
page(
  "/courses/",
  "Free medical courses",
  "Ordered video courses in pharmacology, pathology, pediatrics, orthopedics and clinical medicine.",
  '<h1 class="static-title">Medical courses</h1><p>Public channel playlists retain their published lecture order. Shorts are excluded.</p><ul class="directory-list">' +
    d.courses
      .map(
        (c) =>
          `<li><a href="/courses/${c.id}/">${E(c.title)}</a><small>${c.lectureIds.length} full lectures · ${E(c.orderSource || "Editorial order")}</small></li>`,
      )
      .join("") +
    "</ul>",
  { "@type": "CollectionPage", name: "Medical courses" },
);
const qs = d.videos.flatMap((v) =>
  v.questions.map((q) => ({
    ...q,
    category: q.category || v.category,
    lectureId: v.id,
  })),
);
const questionTitle = (q) =>
  q.title || `${q.category} clinical vignette: ${q.id}`;
for (const q of qs)
  page(
    "/questions/" + q.id + "/",
    questionTitle(q),
    q.prompt,
    `<a class="back" href="/questions/">← Question bank</a><div class="eyebrow">ORIGINAL USMLE-STYLE PRACTICE</div><h1 class="static-title">${E(questionTitle(q))}</h1><div class="prose"><p>${E(q.prompt)}</p><ol type="A">${q.options.map((o) => "<li>" + E(o) + "</li>").join("")}</ol><details class="notes-reveal"><summary>Answer and explanation</summary><h2>${E(q.answer)}</h2><p>${E(q.explanation)}</p><h3>Option explanations</h3>${Object.entries(
      q.distractorExplanations || {},
    )
      .map(([o, t]) => `<p><strong>${E(o)}</strong>: ${E(t)}</p>`)
      .join(
        "",
      )}</details><h2>Related lecture</h2><a href="/lectures/${q.lectureId}/">${E(byId.get(q.lectureId).title)}</a><h2>References</h2><ul>${(q.references || []).map((r) => `<li><a href="${E(r.url)}">${E(r.title)}</a></li>`).join("")}</ul><p><a class="button" href="/#bank">Practice with scoring and review</a></p></div>`,
    {
      "@type": "LearningResource",
      name: questionTitle(q),
      learningResourceType: "Practice question",
      educationalUse: "assessment",
      isAccessibleForFree: true,
      about: q.category,
    },
  );
const qlist = (list) =>
  '<ul class="directory-list">' +
  list
    .map(
      (q) =>
        `<li><a href="/questions/${q.id}/">${E(questionTitle(q))}</a><small>${E(q.prompt.slice(0, 160))}…</small></li>`,
    )
    .join("") +
  "</ul>";
page(
  "/questions/",
  "USMLE-style medical practice questions",
  "Original clinical-vignette questions in pathology, pharmacology and clinical medicine, with answers and explanations.",
  '<h1 class="static-title">USMLE-style practice questions</h1><p>Original clinical vignettes with single best answers and explanations. Practice in <a href="/#bank">tutor or timed exam mode</a>.</p><p><a href="/questions/pathology-usmle-questions/">Pathology USMLE-style questions</a></p>' +
    qlist(qs),
  { "@type": "CollectionPage", name: "USMLE-style practice questions" },
);
page(
  "/questions/pathology-usmle-questions/",
  "Pathology USMLE-style Questions with Answers and Explanations",
  "Practice pathology USMLE-style clinical questions on cell injury, necrosis, amyloidosis and cellular adaptation, with detailed answer explanations.",
  '<h1 class="static-title">Pathology USMLE-style questions</h1><p>Practice the mechanisms behind cellular injury, tissue responses and disease. Each original vignette includes a single best answer, an explanation and discussion of the alternatives.</p><p>These questions are independently authored and are not official USMLE, NBME or UWorld material.</p><a class="button" href="/#bank">Start an interactive practice session</a>' +
    qlist(qs.filter((q) => q.category === "Pathology")),
  { "@type": "CollectionPage", name: "Pathology USMLE-style questions" },
);
fs.writeFileSync(
  "dist/sitemap.xml",
  '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    ["/", ...pages]
      .map((p) => `<url><loc>${E(base + p)}</loc></url>`)
      .join("") +
    "</urlset>",
);
fs.writeFileSync(
  "dist/robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`,
);
fs.writeFileSync("dist/CNAME", new URL(base).hostname + "\n");
fs.writeFileSync(
  "seo-audit.json",
  JSON.stringify(
    {
      pages: pages.length + 1,
      base,
      lecturePages: d.videos.length,
      questionPages: qs.length,
    },
    null,
    2,
  ),
);
// Remove obsolete generated articles after successful generation. Source files are untouched.
const currentPages = new Set(pages.map(route=>path.resolve('dist'+route,'index.html')));
for (const section of ['lectures','courses','questions']) {
  const root=path.resolve('dist',section);
  if (!fs.existsSync(root)) continue;
  for (const entry of fs.readdirSync(root,{withFileTypes:true})) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    const file=path.resolve(root,entry.name,'index.html');
    if (!file.startsWith(root+path.sep)) throw Error('Invalid generated article path');
    if (fs.existsSync(file) && !currentPages.has(file)) fs.unlinkSync(file);
  }
}
console.log("Generated", pages.length, "crawlable HTML pages and sitemap.");

