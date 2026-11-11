# Dr M Medical Academy

Static HTML, CSS and JavaScript. The four sections are Lecture library, Medical courses, Question bank and Flashcards.

## Run and publish

Run `npm run build`, then `npm start`, and open `http://127.0.0.1:4173`. Deploy the **entire contents of dist/**, including article directories and media, to a static host. YouTube playback and thumbnails need internet access.

Set the production domain in `content/site.json`. The SEO pages and sitemap do not publish the site or guarantee search ranking.

## Editing

See EDITING.md for schemas. Edit content JSON and the app source; do not edit generated `library-data.js` or `dist/`.

| Material | Source |
| --- | --- |
| Courses and lecture sequence | content/courses.json |
| Lecture titles and categories | content/lecture-overrides.json |
| Additional lectures | content/additional-lectures.json |
| Explanations and concept maps | content/enriched-*.json |
| Questions | content/questions-*.json |
| Flashcards | content/flashcards-*.json |
| Source corrections | content/source-clarifications.json |
| Unusable figures to omit | content/excluded-slide-images.json |
| Layout and behavior | index.html, academy.css, academy.js, flashcards.js |

## Checks

`npm test` checks routes, quiz logic, scheduling, playlist order, media and generated pages. `npm run audit:content` writes actual coverage to `content-quality-audit.json`. `npm run check:ready` requires the per-lecture targets in content/study-targets.json (five each for unfinished lectures; ten retained for previously completed sets), without unresolved automated findings. Structural checks do not certify clinical correctness.

The 2026-11-07 build contains 1,488 questions and 1,488 flashcards across 257 lectures. All lectures meet their configured minimums: five for newly completed sets, with existing larger sets retained. Read REQUEST-AUDIT.md for the separate status of earlier requests.

## Sources

83 original written notes remain archived; the current source-only publication policy uses matched presentation text and reviewed slide transcriptions. The 126 obsolete root HTML pages were removed after preserving them in `content/legacy-html-sources.json`; rebuilding the imports was verified identical. Keep that source archive. The separate DrM.github.io repository is untouched.

Original decks in D:\Youtube are never modified. Source text and figures are extracted to slide-notes.json; empty and isolated annotation layers are excluded. The 11 missing-deck lectures have partial selectable slide transcriptions; captured frames and supplementary summaries are excluded from published notes. Two demonstration lectures intentionally omit notes. expanded-notes-audit.json records each lecture's source status.

Flashcards provide local scheduling, learning steps, four ratings, undo, bury/suspend, editing, personal cards and JSON/CSV import/export. This SM-2-style scheduler is not Anki's FSRS implementation. There is no AnkiWeb synchronization or .apkg import. JSON backups move progress between browsers; CSV exports import into Anki.

## Refresh

`npm run sync` updates the channel catalogue. `npm run sync:playlists` replaces content/courses.json with public playlist order; preserve deliberate editorial changes first. New lectures require notes, questions and flashcards before readiness checks pass. Shorts are excluded from the deployed application.
