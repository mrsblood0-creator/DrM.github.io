import { renderFooter } from './site-footer.mjs';
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
  let html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${E(title)} | Dr M</title><meta name="description" content="${E(description.slice(0, 170))}"><link rel="canonical" href="${E(url)}"><meta property="og:title" content="${E(title)}"><meta property="og:description" content="${E(description.slice(0, 170))}"><meta property="og:type" content="article"><meta property="og:url" content="${E(url)}"><link rel="stylesheet" href="/academy.css"><link rel="stylesheet" href="/brand-theme.css"><link rel="icon" type="image/png" href="/images/logo.png"><meta property="og:image" content="${E(base)}/images/banner.jpg"><script defer src="/article.js"></script><script defer src="/consent.js"></script><script defer src="/analytics.js"></script><script defer src="/notes-tools.js"></script><script type="application/ld+json">${JSON.stringify(meta).replace(/</g, "\\u003c")}</script></head><body>${header}<main class="view">${body}</main>${renderFooter("/")}</body></html>`;
  // Real relative HTML destinations work on hosts and direct file previews.
  // Canonicals and sitemap entries retain the clean public directory URLs.
  for (const target of ['/privacy/', '/about/']) {
    const relative = path.posix.relative(route, target + 'index.html');
    html = html.replaceAll('href="' + target + '"', 'href="' + relative + '"');
  }
  html = html.replace(/\b(href|src)="\/(?!\/)([^"]*)"/g, (all, attribute, target) => {
    const split = target.search(/[?#]/);
    let pathname = split < 0 ? target : target.slice(0, split);
    const suffix = split < 0 ? '' : target.slice(split);
    if (!pathname || pathname.endsWith('/')) pathname += 'index.html';
    return `${attribute}="${path.posix.relative(route, '/' + pathname)}${suffix}"`;
  });
  const folder = "dist" + route;
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(folder + "index.html", html);
  // Keep informational pages available when previewing the source directory too.
  if (route === '/privacy/' || route === '/about/') {
    const sourceFolder = '.' + route;
    fs.mkdirSync(sourceFolder, { recursive: true });
    fs.writeFileSync(sourceFolder + 'index.html', html);
  }
  pages.push(route);
}
page('/privacy/', 'Privacy policy', 'How Dr M Courses handles study progress, analytics, advertising, embedded videos, and privacy choices.', fs.readFileSync('content/privacy-policy.html', 'utf8'), {'@type':'WebPage',name:'Privacy policy'});
page('/about/', 'About us', 'Meet Mustafa Salahalden, medical doctor and pathology resident, and discover the mission behind Dr M Courses.', fs.readFileSync('content/about.html','utf8'), {'@type':'AboutPage',name:'About Dr M Courses'});
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
    `<a class="back" href="/lectures/">← Lecture library</a><div class="static-layout"><article><div class="eyebrow">${E(v.category)}</div><h1 class="static-title">${E(v.title)}</h1><p class="muted">${E(v.noteStatus)}${v.notesDisabled ? "" : " · "+v.readingMinutes+" min read"}</p><iframe class="static-video" loading="lazy" data-consent-src="https://www.youtube-nocookie.com/embed/${v.id}" title="${E(v.title)}" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><p><a class="button" href="/#lecture/${v.id}">Open study tools</a></p><div class="prose">${notes}</div></article><aside class="static-toc"><strong>Related learning</strong>${d.courses
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
    `<article class="question-article"><nav class="question-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/questions/">Question bank</a><span aria-hidden="true">/</span><span>${E(q.category)}</span></nav><header class="question-heading"><div class="eyebrow">USMLE-style practice · ${E(q.category)}</div><h1>${E(questionTitle(q))}</h1><p class="muted">Choose the single best answer, then reveal the explanation.</p></header><section class="question-case" aria-label="Clinical question"><p class="question-stem">${E(q.prompt)}</p><ol class="question-options" type="A">${q.options.map(o=>'<li>'+E(o)+'</li>').join('')}</ol></section><details class="question-solution"><summary>Reveal answer and explanation</summary><div class="question-solution-body"><div class="eyebrow">Correct answer</div><h2>${E(q.answer)}</h2><p>${E(q.explanation)}</p>${Object.keys(q.distractorExplanations||{}).length?'<h3>Understanding the options</h3><dl class="question-rationales">'+Object.entries(q.distractorExplanations||{}).map(([o,t])=>'<div><dt>'+E(o)+'</dt><dd>'+E(t)+'</dd></div>').join('')+'</dl>':''}</div></details><section class="question-related"><h2>Explore the related lecture</h2><a href="/lectures/${q.lectureId}/">${E(byId.get(q.lectureId).title)}</a></section><section class="question-next"><div><h2>Ready for more practice?</h2><p>Study this lecture’s questions with scoring and answer review.</p></div><a class="question-practice-button" href="/#bank/${q.lectureId}">Practice this lecture <span aria-hidden="true">→</span></a><a class="question-all-link" href="/#bank">Browse the full question bank</a></section></article>`,

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

