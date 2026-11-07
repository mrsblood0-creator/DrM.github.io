# Dr M medical learning library

A buildless HTML, CSS, and JavaScript website. No framework, API key, or installed npm dependencies are required. Use Node 22 or later for maintenance commands.

## Preview

Run `npm start` from `D:\Website`, then open http://127.0.0.1:4173. Serve over HTTP(S); opening the file directly can prevent YouTube embeds from receiving the required referrer.

## Included content

- All 299 unique public entries discovered on 23 October 2026: 256 videos and 43 Shorts.
- The Videos tab was followed through nine pages. The Shorts tab exposed 43 entries on one page. The channel has no separate public Streams tab.
- 80 entries use existing local lecture articles, with explicit source labels.
- 219 entries have newly authored, concise topic revision guides. These are labelled drafts, not transcripts or instructor-reviewed material.
- 894 multiple-choice recall questions with answer explanations and scoring.
- Search, five subject filters, sorting, saved lectures, completion tracking, and personal notes stored on the learner’s browser.

`channel-catalog.json` records the sync date and pagination report. `content-audit.json` records coverage and article matches. Private, deleted, unlisted, members-only, or otherwise inaccessible videos cannot be enumerated from a public channel listing. The snapshot is not a continuously synchronized feed.

## Study material

`study-guides.json` contains editable guides keyed by YouTube video ID. Existing HTML articles remain available and unchanged; their text is imported at build time. Original articles have not received a comprehensive medical review. New guides cover core concepts rather than every detail of the recording. Guideline-sensitive pages link to relevant references. All medical content and MCQs should receive instructor review before use as an assessed course or clinical reference.

`scripts/author-guides.mjs` is an editorial seed tied to the original snapshot order, not the regular update pipeline. Do not rerun it against a reordered or updated catalogue. Edit `study-guides.json` by video ID instead.

## Updating

1. Run `npm run sync` to fetch the current public channel tabs and follow pagination. The scraper uses YouTube’s public web responses; markup changes can require maintenance.
2. Add reviewed notes and questions for new video IDs in `study-guides.json`.
3. Run `npm run build`. It refuses to finalize new entries without a guide, validates the entire library, and copies the five public files into `dist/`.

Keep the previous `dist/` until a new build passes. No scheduled task has been installed.

## Hosting

Upload the contents of `dist/` to any static HTTPS host, including GitHub Pages. It contains `index.html`, `academy.css`, `academy.js`, `originals.js`, and `library-data.js`. Hash-based lesson links work without server rewrites. No site has been published by this task. The nested `DrM.github.io` checkout was not modified.

YouTube serves the video streams and thumbnails. Playback depends on the channel’s embedding permissions, viewer restrictions, and network access; each lesson has a direct YouTube fallback. Google Fonts has system-font fallbacks. Personal notes and progress remain in localStorage and do not sync across devices.

## Verification

`npm test` validates unique IDs, full catalogue coverage, note and quiz coverage, four distinct choices and a valid answer per question. It exercises all lesson routes, search, pagination, scoring, bookmarks, progress, and note persistence in a DOM test harness. This is not a full browser-layout test. Browser preview confirmed desktop and mobile layouts, search, lecture notes, a loaded YouTube embed, and quiz scoring with explanations; full video playback and every external embed were not exhaustively tested.

The previous homepage was retained as `legacy-home.html`. Existing article styling remains in `style.css`; the new site uses `academy.css`.


## Complete original articles

All 252 previous HTML files from the root and nested checkout are represented in 105 deduplicated entries, including empty originals. Use Original articles to search titles, filenames, and full text. Complete original content appears beneath all 80 matched videos, including tables, introductions, short text, and course menus. Source wording is preserved; this is a content migration, not a medical fact-check.

The import is embedded in library-data.js. Existing local images are embedded, so the deployed site does not need the previous HTML or image folders. Five pre-existing missing image references are recorded in original-content-audit.json. Keep source files for future rebuilds. Scripts from original pages are removed and their content is displayed in sandboxed frames. Internal article links point to the new reader. Run node scripts/verify-originals.mjs to audit complete file coverage.

