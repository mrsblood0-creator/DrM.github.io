# Audit of all website requests

Generated 2026-11-07T07:45:58.193Z. **All requests are not yet complete.** Functional tests passing does not establish medical accuracy or full content coverage.

## Current coverage

- 257 full lectures; 37 course groups.
- 1488 questions; 1488 flashcards.
- 257/257 lectures meet their per-lecture minimums (five for unfinished lectures; ten retained for completed sets).
- At least 0 additional questions and 0 additional flashcards are needed at current coverage.
- 11/103 frame-based lectures have published partial slide transcriptions; presentation-derived notes are accepted without further full-video verification at the user’s request.

## Request-by-request review

| Request | Status | Evidence / remaining work |
| --- | --- | --- |
| All public full videos, no Shorts | Implemented for latest sync | 257 full lectures; 43 Shorts excluded. Catalogue checked 2026-11-04T21:58:48.647Z. Private/deleted videos cannot be inventoried. |
| Video playback on lecture pages | Implemented; playback availability external | Embedded players and per-video YouTube links exist; every video has not been manually played through. |
| Import old lecture notes; remove old articles and obsolete HTML | Superseded by source-only notes request | 83 original note imports remain archived. Published lecture notes now exclude legacy notes and supplementary explanations unless verified slide text is available. 126 obsolete root HTML files were previously archived/removed. |
| Lecture library and playlist-ordered medical courses | Implemented | 37 course groups; latest public playlist snapshot 2026-11-04T21:59:53.030Z. Build verifies each imported sequence. |
| Logo, banner, off-white theme, large readable text | Implemented | Supplied images/logo.png and images/banner.jpg used. Navy/cyan/magenta theme and off-white page background. |
| Separate thumbnails from lecture titles | Implemented and browser checked | Responsive image-above-text cards; visible desktop/mobile cards checked for overlap. |
| Complete slide-aligned lecture notes for every video | Source presentations accepted by user | 242 matched presentation sources and 11 manually transcribed slide sets are published. The user waived full-video transcription verification for presentation-derived notes on 2026-11-06. |
| Convert presentation reference frames to copyable text | Incomplete | 11 of 103 frame-based lectures have published partial slide transcriptions. Five older narration/study summaries remain archived. No complete video transcript is certified; OCR drafts are not published. |
| Original lecture figures and credited supplementary images | Original figures implemented; supplementary selection pending | Usable original presentation figures are displayed with available source credits. Captured video frames remain excluded. The pathology import includes 123 figures; blank/decorative/unsupported assets are recorded separately. Additional external figures require reusable licensing and attribution. |
| Source-only selectable lecture notes and clickable outlines | Layout implemented; transcription incomplete |  242 source presentations plus 11 partial manually checked slide transcriptions are published. All captured frames and supplementary diagrams/notes removed. 0 lectures still have no published slide text; 4 lectures intentionally omit notes at the user’s request. Outline links and lecture-specific practice links are implemented; full video alignment remains unverified. |
| At least five high-quality USMLE-style questions per lecture | Authored coverage complete; independent clinical review not certified | 1488 questions; 257/257 lectures meet quantity. Clinical review cannot be established by automated checks. |
| At least five high-quality flashcards per lecture | Authored coverage complete; whole-bank independent review pending | 1488 flashcards; 257/257 lectures meet quantity. Atomicity and learning value still need whole-bank editorial review. |
| Question-bank functionality | Core functionality implemented | Tutor/exam sessions, timing, filters, answer explanations, bookmarks and review history pass automated checks; comprehensive browser acceptance testing remains. |
| Flashcards with full Anki functionality | Partial | Learning/review scheduling, ratings, undo, bury/suspend, personal editing, CSV and JSON exchange exist. AnkiWeb sync, APKG, FSRS and image occlusion are not implemented. |
| Copy/edit lecture text | Implemented for existing text | Copy, text download and personal browser-saved edits work on app and static lecture routes. Text trapped in unreviewed source images remains outstanding. |
| SEO and search discovery | Local implementation complete; live status unverified | Static lecture/course/question pages, metadata, structured data and sitemap built. Domain ownership, deployment and search indexing are not established. |
| Maintainable code and adding content | Implemented with further cleanup possible | EDITING.md describes content formats. Build scripts and JSON files separate content from UI. Playlist refresh now preserves the previous complete catalogue on network/parse failure. |
| Use external Step 1/Step 2 questions and flashcards | Original source-informed content implemented | Original source-informed questions are used. Direct reuse requires public-domain status, a compatible license or permission; internet availability alone is not permission. |
| Complete final release and all earlier orders | Not complete | Question and flashcard minimums are complete. Full slide transcription, complete Anki parity and live publication checks remain open. |

## Continuing the work

The exact per-lecture deficits are in [the CSV checklist](content/lecture-completion-checklist.csv). All current study-set quantity targets are met. Use the checklist for newly added lectures; never publish unreviewed OCR as accurate slide text. Keep stable IDs and cite supporting references.

Run npm run audit:requirements to regenerate this report after the content and frame audits. npm run check:ready must fail while question/card minimums remain unmet. No all-complete claim is justified until every requirement above has been verified.
