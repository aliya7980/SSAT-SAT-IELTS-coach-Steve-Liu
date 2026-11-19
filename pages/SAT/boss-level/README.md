# SAT Boss Level

The growing collection of challenging SAT Reading and Writing questions is linked from the Reading and Writing section of `pages/sat.html`.

To add a question:

1. Save its original picture in `images/` with the next number, for example `question-002.jpeg`.
2. Duplicate the existing `<article>` in `index.html` and give it a unique ID (`question-002`).
3. Update the question number, title, tags, image source/dimensions/alt text, and `data-search` keywords.
4. Replace the answer and analysis inside that article's `<details>` element. Keep the reasoning tied to the source question and explain why the other choices fail.

The search matches keywords and question text. The visible question count updates automatically on load and while searching. No backend or setup is needed.

Question 001: silica cements and grains, Ge/Si ratios; original picture and answer analysis imported from the supplied SAT Boss Level update.
