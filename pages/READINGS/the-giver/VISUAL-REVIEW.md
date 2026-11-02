# Giver visual and readability review

Prepared 2 November 2026 from GitHub main commit `82e96e56aef360c578bd7874b869297fad04b103`.

**Delivery status:** implemented in a separate review copy. The Desktop checkout could not be read or edited: the operating system returned “Operation not permitted.” Nothing was committed, pushed, or published. The update package is not a full copy of the website; merge its files into the existing repository to use the sitewide navigation.

## Pages improved

All 18 existing study pages received the new reading layer: Start Here, Chapter Guide, Plot, Setting, Characters, Conflicts, Themes, all six individual themes, Motifs and Symbols, Techniques, Writing, Assessment, and Sources. A nineteenth page, Image Credits, is linked from every footer and image credit.

## Reading changes

- Desktop body text is 18px with 1.75 line height; phones use 17px. Paragraphs and lists are limited to 68 characters of nominal font width. The text is left aligned.
- Long plain prose is divided at sentence boundaries without rewriting or removing words. Purposeful model, summary-comparison, and revision-example paragraphs remain intact as teaching examples.
- Key-idea introductions put the main point first; small vocabulary guides define essential terms in familiar language.
- Long pages have spoiler-aware in-page navigation. Each available chapter has Summary, Analysis, and Questions & writing links. The existing chapter menu, progress, previous/next controls, and saved responses remain.
- Plot explanations now remain visible rather than requiring five separate accordions. Teacher answers stay deliberate reveals. Optional qualification and relationship detail use “Look more closely.”
- Tables retain their comparison layout on desktop. At phone widths they default to stacked rows with labelled fields; a keyboard-operable toggle lets students choose either view. On small screens, precise labelled diagrams scroll within their frames rather than shrinking text too far.
- Printing uses the comparison tables once, includes figure captions and credits, and continues to exclude teacher content unless explicitly selected.

## Photographs and source permissions

| Image | Creator | Source and reuse basis | Use |
| --- | --- | --- | --- |
| Red apple on white background | Sprinno | [Wikimedia Commons file page](https://commons.wikimedia.org/wiki/File:Red_apple_on_white_background.jpg); CC0 1.0 | Grayscale/original-colour comparison in gated individuality and symbol analysis. The 281×303 original is not enlarged into a banner. |
| Valley in winter snowy winter landscape | Goldmann Jo, U.S. Fish and Wildlife Service | [Wikimedia Commons file page](https://commons.wikimedia.org/wiki/File:Valley_in_winter_snowy_winter_landscape.jpg); author’s public-domain dedication recorded on that page | Memory page; explicitly an illustrative landscape, not the novel’s location or proof of its ending. |
| Library shelves iitd | Scntst0009 | [Wikimedia Commons file page](https://commons.wikimedia.org/wiki/File:Library_shelves_iitd.jpg); CC0 1.0 | Chapter guide; real IIT Delhi library shelves, explicitly not the Annex. |

The source pages and actual images were opened and inspected. Downloaded images were compressed to WebP, with aspect ratios preserved. Image dimensions, alt text, lazy loading, source URLs, permissions, modifications, and credits are recorded in `asset-manifest.json` and the Image Credits page. All images are local; there are no external image hotlinks.

Twelve original SVG diagrams cover uniformity, choices, human connection, language and evidence, responsibility, conflict/consequence, writing evidence, revision, plot structure, selected character relationships, Jonas’s development, and theme topics. They are conceptual teaching visuals, not invented documentary images of the community. The individual theme pages use distinct visuals. The diagrams were rendered with the native image renderer and inspected; a background-rendering issue and plot-label overlap were corrected.

No film stills, posters, actor portraits, or film-only scenes are used. No film image permission is assumed. Photographs and conceptual diagrams do not serve as textual evidence.

## Checks completed

- All **837 original paragraphs** were located verbatim after whitespace normalization. Paragraph division did not remove content. Canonical `chapters.json` and `evidence-checks.json` remain byte-identical to the snapshot.
- Existing content checks pass: 23 ordered chapters, content lengths, nine profiles, six substantive themes and models, source links, local navigation/assets/fragments, unique IDs, and form labels.
- Fifteen local assets and nineteen image uses pass existence, dimension, caption, credit-anchor, and spoiler-gate checks. Colour comparison, snow, plot, conflict-event, relationship, and development images are inside Full novel containers. The credits page does not display spoiler photographs.
- Automated interaction tests pass for stacked-row defaults, toggling, responsive breakpoint changes, accessible toggle state, and hiding in-page links to spoiler-hidden sections.
- The existing print-handler tests pass: student output excludes opened teacher answers; deliberate opt-in includes them; later chapter content stays hidden; disclosure state is restored. Print CSS checks cover captions and single table output.
- JavaScript syntax checks pass. Local HTTP serving returned 200.

**Browser limitation:** the browser service failed to start with an “Operation not permitted” process error. New desktop/phone page layouts, live keyboard focus, image cropping in the page, and paginated print output have therefore **not** been visually verified. Photo files and rendered SVGs were visually inspected independently. Do not confuse those asset checks or the automated interaction tests with a rendered-page review. The earlier content-version screenshots are not evidence for this revision.

## Files and maintenance

New presentation files are `reading.css`, `reading.js`, `asset-manifest.json`, `image-credits.html`, the `images/` files, `tools/giver_visuals.py`, `tools/check-giver-visuals.py`, and `tools/check-giver-reading.cjs`. The existing build script now runs the presentation pass after the content renderer. All generated study HTML files and the inventory were refreshed. `study.js` and `study.css` remain unchanged.

Run from the repository root:

```sh
python3 tools/build-giver.py
python3 tools/giver_inventory.py
python3 tools/check-giver.py
python3 tools/check-giver-visuals.py
node tools/check-giver-reading.cjs
node tools/check-giver-print.cjs
node --check pages/READINGS/the-giver/reading.js
python3 -m http.server 8000
```

Then open `http://localhost:8000/pages/READINGS/the-giver/index.html`. Review Home, Chapters, a theme, Characters, Writing, and Assessment at desktop and phone widths before publishing. Use Full novel and Read up to Chapter 23 deliberately when checking gated content.

The underlying novel-text verification limits from the prior content revision remain unchanged. This presentation pass adds no novel quotations or unverified film information.
