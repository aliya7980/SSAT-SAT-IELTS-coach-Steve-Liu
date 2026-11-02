# The Giver Grade 8 course

This is a buildless, static course under the existing reading resources. The entry is already beside Monte Cristo in `pages/readingtips.html`. Keep this course’s substantive lessons when revising its design; headings, generic questions, and external links do not replace teaching content.

## Sources of content

- `chapters.json`: 23 chapter-safe summaries, developments, insight, literary explanation, theme connection, questions, answers, and writing prompts.
- `tools/giver_lessons.py`: complete long-form lessons, character profiles, six theme investigations, writing models, and assessment explanations.
- `tools/build-giver.py`: shared shell, retained components and data, followed by the complete lesson renderer. Run from the repository root.
- `study.js` / `study.css`: browser-local interactions and presentation.
- `evidence-checks.json`: source map and important chapter boundaries.

Do not edit generated HTML alone: rebuilding will replace those edits. Do not invent quotations or pages. Use event paraphrase when exact wording is unavailable; distinguish an event from an inferred motive. Keep film and sequel information out of novel evidence. Theme models should explain effects, test a tension, and connect to an argument rather than retell a sequence.

## Rebuild and check

```sh
python3 tools/build-giver.py
python3 tools/giver_inventory.py
python3 tools/check-giver.py
node tools/check-giver-print.cjs
node --check pages/READINGS/the-giver/study.js
```

`CONTENT-INVENTORY.md` reports generated page sections, totals, chapter-field counts, theme teaching counts, and model lengths. Refresh it after content changes. The checks detect thin fields and accidental duplicate explanations but do not substitute for reading the novel.

## Preview

Run `python3 -m http.server 8000` in the repository root, then open `http://localhost:8000/pages/READINGS/the-giver/index.html`.

Progress and optional responses are stored only in the current browser and origin with the prefix `huskydaddy.giver.v1.`. Preserve the prefix and stable field IDs to keep existing work. The spoiler preference and read-through limit are separate. Retrospective chapter notes require Chapter 23 and Full novel mode.

Teacher reveals are not access control. Print output excludes them by default even if opened on screen. The nonpersistent Include teacher answers in print checkbox deliberately opts in. Do not make teacher-print selection persist between pages or sessions. Test both printing paths and confirm that later chapter content remains hidden.

No deployment or push is part of this local workflow without explicit user authorization. See `IMPLEMENTATION-REPORT.md` for the specific verification limits of this revision.
