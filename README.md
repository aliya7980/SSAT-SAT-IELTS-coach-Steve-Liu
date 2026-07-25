# SSAT-SAT-IELTS-coach-Steve-Liu
Steve Liu's Nest for SAT/SSAT
https://aliya7980.github.io/SSAT-SAT-IELTS-coach-Steve-Liu/index.html

## Site organization

Public HTML pages keep their existing addresses so bookmarks and search links
continue to work. Supporting files are grouped by type:

- `assets/images/` — branding, lesson, service, and general site images
- `assets/documents/` — downloadable PDFs grouped by subject
- `assets/data/` — CSV and other structured lesson data
- `assets/styles/` — shared and section-specific stylesheets
- `assets/scripts/` — shared JavaScript
- `pages/` — public lessons, services, practice activities, and articles

Run the internal reference check after changing or moving files:

```sh
node scripts/check-internal-links.mjs
```

The checker currently reports four pre-existing links whose source files are
not in this repository: the SAT practice landing page and three book pages
linked from `pages/readingtips.html`.

## This website was made by Cheddar12010 on GitHub
### Contact the builder @ https://discord.com/users/545427877676580874
