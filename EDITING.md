# Editing guide

## Current lecture-note policy

Pathology decks supplied in `D:\2 Pathology\13 Pathology` are imported with `scripts/import-pathology-decks.py`. Run it with Python after editing those decks, then run `npm run build`. The extracted snapshot is `content/pathology-slide-notes.json`; build does not require the external folder. `content/pathology-deck-import-audit.json` lists source files and slides without native text. This import preserves slide order, native tables and usable original figures with source captions, and never treats image-only slides as transcribed.

The latest request supersedes the supplementary-note workflow below. Published lecture notes contain selectable text and native tables extracted from matched source presentations, with a clickable outline and lecture-specific practice links. Captured video frames, narration summaries and imported legacy prose are not rendered. Original presentation figures are displayed after filtering blank/annotation-only assets. Additional external figures must have a documented reusable license, creator credit and source link; courtesy alone does not establish permission. The original assets and authored material remain archived for review. A matched deck is not proof of exact video alignment; missing slide transcriptions remain visibly pending. Do not publish OCR drafts or topic summaries as slide transcripts. `scripts/enrich-notes.mjs` owns this rendering policy.

All editable data is UTF-8 JSON. Lectures are keyed by the eleven-character YouTube video ID. Each lecture exists once; courses and study items reference it.

## Lectures and courses

Run `npm run sync` to refresh the public channel. Add newly discovered lectures to `study-guides.json` with a heading, a notes array of `{type,text}`, and an empty questions array. Detailed explanations belong in `content/enriched-*.json`. Unlisted lectures can be added explicitly to `content/additional-lectures.json` with id, title, category, duration and notes. Do not add Shorts.

Use `content/lecture-overrides.json` for category/title corrections keyed by ID. Each course in `content/courses.json` has id, title, category, description and an **ordered lectureIds array**. Playlist-backed courses also record playlistUrl and orderSource. If you deliberately change a playlist sequence, remove playlistUrl and label the sequence as editorial; otherwise the playlist test will correctly flag a mismatch.

## Detailed notes

Create an object keyed by lecture ID in `content/enriched-your-topic.json`:

```json
{
  "VIDEO_ID_11": {
    "overview": "What the lesson explains and how its source was checked.",
    "map": [{"label":"Trigger","detail":"Explain the first step."}],
    "sections": [{"heading":"Mechanism","paragraphs":["Clear explanation."],"bullets":["A useful distinction."]}],
    "pearls": ["One important takeaway."],
    "references": [{"title":"Supporting source","url":"https://example.org/source"}]
  }
}
```

Do not invent slide text or source verification. Deck matches are recorded in slide-map-*.json. Source extraction uses scripts/extract-slide-notes.py and the original decks. To exclude a visually reviewed, unusable figure, add its asset filename and a reason to content/excluded-slide-images.json, rerun extraction, then build. Python and Pillow are required for extraction only.

## Questions

Create `content/questions-your-topic.json` with an array of records:

```json
[
  {
    "id":"unique-stable-question-id",
    "lectureId":"VIDEO_ID_11",
    "category":"Pathology",
    "title":"Descriptive topic title",
    "prompt":"An original clinical or experimental vignette ending with a precise single-best-answer lead-in?",
    "options":["Option A","Option B","Option C","Option D","Option E"],
    "answer":"Option C",
    "explanation":"Explain the findings, mechanism and why this answer is best.",
    "distractorExplanations":{"Option A":"Why A is less appropriate.","Option B":"Why B is less appropriate.","Option C":"Why C is correct.","Option D":"Why D is less appropriate.","Option E":"Why E is less appropriate."},
    "references":[{"title":"Supporting source","url":"https://example.org/source"}]
  }
]
```

Use five plausible alternatives at the same conceptual level. Avoid proprietary copying, trivial cloze, answer leakage, absurd distractors, and repeated cases with only demographics changed. Check age, timing, units and clinical assumptions. Target five distinct learning objectives for unfinished lectures; preserve existing larger sets.

`questions-reviewed-*.json` replaces the earlier question set for its lecture IDs. Only publish such a file after completing the replacement set. Reviewed means source-informed editorial review, not clinician certification. Stable IDs preserve article URLs; practice-session IDs derive from the content to avoid applying old answers to a changed question.

## Flashcards

Create `content/flashcards-your-topic.json`:

```json
[{"id":"unique-stable-card-id","lectureId":"VIDEO_ID_11","front":"One precise recall question?","back":"A concise answer.","explanation":"Why it matters or how it follows from the mechanism."}]
```

Keep one main idea per card. Avoid answer leakage, vague prompts, long lists and exact duplicates. Ten cards should cover mechanisms, discriminating features, interpretation and important cautions. `flashcards-reviewed-*.json` replaces earlier cards for its lecture IDs. Preserve IDs when correcting wording so students retain their schedules.

## Copyable presentation text

`content/frame-transcriptions/reviewed.json` contains manually checked text recovered from video frames, grouped by lecture ID and timestamp. Each section has `heading`, `seconds`, and `paragraphs`; outdated source statements can also have `clarification` and `reference`. Keep repeated or empty slides out of this file. These sections appear beside their source references and support Copy notes, Edit my copy, and Download text on both article and library pages. Student edits are browser-local copies, not changes to these source files.

`scripts/extract-frame-text.ps1` uses the Windows English OCR component through Windows PowerShell 5.1. It saves drafts under `content/frame-transcriptions/drafts/`. Drafts are never imported into the website. Low-resolution OCR makes medical spelling and numerical errors: review against the actual image before moving any text to reviewed.json. Sampling does not establish full-video coverage.

Reviewed question/card files are published per lecture only when they contain the configured minimum number of structurally complete items for that lecture. In-progress groups are listed in `content/pending-review-sets.json`; structural validity is not a substitute for clinical review.

## Verify and deploy

Run `npm run build`, `npm run audit:content`, and `npm run check:ready`. Inspect content-quality-audit.json for per-lecture counts and quality flags. Review the rendered site. Deploy the full dist directory after checks and clinical review. Retain content, scripts, source inventories and original sources for future edits; those are not deployment files.

Brand styling lives in brand-theme.css (loaded after academy.css). Replace images/logo.png and images/banner.jpg to update the supplied branding, then run npm run build. Both assets are packaged into dist/images; static articles share the same theme.


Established original HTML imports are pinned by video ID in content/legacy-note-map.json. A YouTube title change must not detach or rematch these notes. New legacy imports can be added to this mapping after checking the destination lecture.

Use npm run audit:requirements for the complete requirements report and content/lecture-completion-checklist.csv for per-lecture deficits.

External study material: write original questions using cited clinical sources. To republish an existing question/card, retain its source, license and attribution and verify that the license or permission permits website redistribution. Public accessibility alone is insufficient.

Study targets (updated 5 November 2026): five questions and five flashcards for unfinished lectures. Completed ten-item sets retain a target of ten. content/study-targets.json is the single source for build gates and coverage audits. Do not shrink completed sets.

A supplementary note entry may specify illustration (the filename stem of an SVG in illustrations/) and illustrationCaption. Keep equivalent text in the note body or review table so the diagram does not trap important information in an image. Use explicit model assumptions for numerical examples.

Corrections to imported notes belong in content/legacy-note-corrections.json, keyed by lecture ID as exact original/replacement text pairs. The build applies these to the displayed and exported notes, labels the corrected edition, and fails if an original phrase no longer matches. Keep supporting references in the lecture and preserve the archived original sources.


## New pharmacology PowerPoint sources

`content/pharmacology-deck-mapping.json` maps 80 source decks to existing lecture IDs. The saved extraction in `content/pharmacology-slide-notes.json` is used at build time, so visitors and deployment do not need access to the source folder. Run the following from the website root after changing a source deck or mapping:

```powershell
python scripts/import-pathology-decks.py content/pharmacology-deck-mapping.json
npm run build
npm run audit:requirements
```

The importer also handles pharmacology through this configuration. It preserves native text, tables and usable source figures. Imported decks take priority over archived partial frame transcriptions. The import audit lists image-only slides and excluded assets; unmatched files and reasons are in `content/pharmacology-unmatched-decks.json`. Matching a deck by topic is not verification against every video slide.


`content/lecture-note-policy.json` lists video demonstrations for which the user requested no lecture notes. These videos remain in the library; their note panel is hidden in the app and omitted from static pages. This exemption does not remove their questions or flashcards.


## Google Analytics

`analytics.js` uses GA4 measurement ID `G-933HR3MDFY` on the main app and generated pages. It sends initial and hash-route page views, deduplicates identical routes, and skips localhost/file previews. Deployment of the updated dist directory is required.

In GA4 Admin → Data streams → your web stream → Enhanced measurement → Page views → Advanced settings, disable **Page changes based on browser history events** because this site sends its own route page views. Keep ordinary Page views enabled. Verify the published site in Realtime; local checks do not confirm receipt by Google.
