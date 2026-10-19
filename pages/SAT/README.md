# SAT mock tests

Open `index.html` to choose a mock test. August and September use the existing August stylesheet, typography, two-column question layout, navigation, mark-for-review, cross-outs, 32-minute module timers, results review and teacher access code. Original August URLs remain usable.

## Editing tests

Each test has its own directory in `data/`:

- `metadata.json`: stable ID, display name and timing.
- `questions.json`: modules `1` and `2`, each containing 27 questions. `n`, `skill`, `passage`, `prompt` and `choices` follow the existing format. Optional `images` supports multiple visuals in source order.
- `answer-key.json`: `answers` maps `m1q1` through `m2q27` to `A`, `B`, `C` or `D`. Missing keys are pending, never guessed.

After changing JSON, run:

```sh
python3 tools/build-sat-data.py
node tools/check-sat-tests.cjs
```

The first command regenerates `data/august2026.js` and `data/september2026-practice1.js`, which are browser-ready data bundles. There is no package manager or separate application build. Serve the repository with VS Code Live Server or another local HTTP server to preview it.

## September extraction documents

`data/september2026-practice1/transcription.md` contains all 54 Reading and Writing questions. `source-metadata.json` records the original PDF hash and scope. The 67-page source contains Math as well; only the two Reading and Writing modules (PDF pages 5–45) were imported into this Reading and Writing application. Original PDFs were not changed or committed.

`visual-manifest.json` and `.csv` identify every visual by test ID, module and question. PDF page indices are zero-based; PDF page numbers and printed page numbers are recorded separately. Crop coordinates are `[left, top, right, bottom]` in pixels on a 1190 × 1683 render at 144 dpi, with a top-left origin. Visuals were cropped from the actual rendered source, with no data reconstruction or redrawing.

## Saved progress and attempts

Storage keys are `hd_sat_<test ID>_progress`, `_attempts` and `_key`. August imports the former `hd_sat_attempts` and `hd_sat_key` values once, without deleting legacy entries. Progress includes responses, marks, cross-outs, module, question and remaining time. Reloading presents a Resume button. Time is paused while the page is closed, matching a resumable practice session.

Results and teacher URLs carry `?test=<test ID>`. Each completed attempt records its test ID. Results submitted before a key exists remain ungraded; adding the key later grades those saved responses. Teacher key edits remain local to that browser and test, as in the existing site. To supply a key to all students, update the corresponding JSON and regenerate its bundle.

## Validation performed

- Two modules of 27 unique questions in source order for each test; all four choices present.
- All 54 August answer mappings retained; September has zero invented mappings.
- Five visual mappings checked against printed question numbers, question subjects and original source page renders; all referenced PNGs exist.
- Every final crop inspected; every associated rendered question inspected in Chrome's 365-pixel responsive view. Desktop two-column layout also inspected.
- Browser flow checked through both module submissions, pending-key results and teacher login showing the September attempt.
- Automated behavior checks cover August scoring, unanswered questions, review filters, September pending keys, later-key grading, cross-test storage isolation, August legacy migration and progress resume.
- JavaScript syntax and `git diff --check` checked. No deployment or push performed.

## Unresolved / source limitations

1. September answer key awaits the teacher. The interface clearly shows pending status and does not score unkeyed questions.
2. The original Module 2 Q10 chart clips the beginning of its axis-description text. The crop preserves all visible source content.
3. The original PDF includes promotional sentences within several passages. These were retained to follow the instruction to preserve original text.

## Visual mapping

All image filenames below are relative to `august-2026/images/september2026-practice1/`.

| Module | Question | PDF page (1-based) | PDF index (0-based) | Printed page | Image filename |
|---|---|---|---|---|---|
| 1 | 11 | 13 | 12 | 12 | m1-q11-table.png |
| 1 | 13 | 15 | 14 | 14 | m1-q13-chart.png |
| 2 | 9 | 31 | 30 | 30 | m2-q09-table.png |
| 2 | 10 | 32 | 31 | 31 | m2-q10-chart.png |
| 2 | 11 | 33 | 32 | 32 | m2-q11-table.png |
