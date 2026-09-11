# Landing Page Redesign: Lean Jekyll, al-folio Style

**Date:** 2026-09-11
**Status:** Approved
**Scope:** `index.html` → Jekyll-rendered landing page. Project sub-pages explicitly out of scope.

## Goal

Replace the Jon Barron table-based template with a modern, responsive, dark-mode-capable
landing page in the visual idiom of al-folio, built on a lean Jekyll setup that uses only
GitHub Pages' built-in plugins.

All existing content is preserved. No content is added or removed. The only text changes are the
typo corrections itemized under "Pre-Existing Defects to Fix" — no sentence is rewritten or
restyled beyond those.

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Ambition | Full rebuild of the landing page | Table layout caps how good responsive can get |
| Visual reference | al-folio | Modal choice for recently-redesigned ML/CS pages |
| Stack | Jekyll | Publications/news move to data files; standard in the field |
| Theme | Lean custom, not a fork of al-folio | ~10 readable files vs ~200; avoids `jekyll-scholar`, which is off the GH Pages allowlist |
| Ruby | Install Homebrew Ruby + Jekyll locally | Enables local preview and pre-push build verification |
| Palette | Indigo `#4F46E5` / teal `#0D9488` on zinc neutrals | Reads contemporary rather than institutional |
| Dark mode | Auto (OS) + manual toggle, persisted | al-folio behavior; expected on a modern page |
| Structure | Single page, anchor nav | Preserves current URLs; content fits comfortably |
| Footer | Keep flag counter; keep credit, reworded to al-folio | User preference |
| Project pages | Unchanged | Deliberate; accepted visual inconsistency |

## Non-Goals

- No changes to `dualvision/`, `deep_edm/`, `rica2_aqa/`.
- No new content, no rewording of existing copy.
- No blog, teaching, or projects sections.
- No BibTeX pipeline. Publications are hand-authored YAML.
- No CI/GitHub Actions. GitHub Pages' native Jekyll build only.

## File Structure

**Toolchain:** Ruby 3.3 via Homebrew, and the `github-pages` gem, which pins Jekyll and every
plugin to the exact versions GitHub Pages runs. System Ruby 2.6.10 is not used — it is deprecated
and native-extension builds against it are unreliable on current macOS.

```
_config.yml                 site metadata, build config
Gemfile                     github-pages gem
index.md                    front matter + section includes only
_layouts/default.html       html shell, theme bootstrap
_includes/
  head.html                 meta, fonts, favicon, OG tags
  nav.html                  sticky nav + dark-mode toggle
  hero.html                 name, tagline, bio, links, logo strip
  news.html                 renders _data/news.yml
  publications.html         renders _data/publications.yml
  footer.html               flag counter, credit, copyright
_data/
  news.yml                  12 entries
  publications.yml          7 entries
assets/css/main.scss        design tokens + all styling
assets/js/theme.js          theme toggle + localStorage
archive/
  index_old.html            backup of current landing page
  stylesheet_old.css        backup of current stylesheet
```

Unchanged: `images/`, `data/`, `dualvision/`, `deep_edm/`, `rica2_aqa/`, `README.md`.

Deleted from root after backup: `index.html`, `stylesheet.css`.

**Why `index.html` must move:** with both `index.html` and `index.md` present, Jekyll serves
the static `index.html` and ignores `index.md`. Moving it to `archive/` resolves the conflict
and serves as the backup in one step.

## Data Model

### `_data/publications.yml`

```yaml
- title: "DualVision: RGB–Infrared Multimodal Large Language Models for Robust Visual Reasoning"
  authors: "**Abrar Majeedi**, Zhiyuan Ruan, Ziyi Zhao, Hongcheng Wang, Jianglin Lu, Yin Li"
  venue: "IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR) Findings"
  year: 2026
  media:
    type: image          # image | video
    src: dualvision/img/main_fig_a.png
  links:
    - {label: "Project Page", url: "https://abrarmajeedi.github.io/dualvision"}
    - {label: "Code", url: "https://github.com/abrarmajeedi/DualVision"}
  blurb: "A lightweight RGB-IR fusion module for multimodal large language models..."
```

Field contract:

- `title` — required, plain text. Rendered inside the heading link.
- `authors` — required. `**bold**` marks the site owner; the template converts it to `<strong>`.
  Real author URLs are preserved via the optional `author_links` map below. The six empty
  `<a href="">` tags on the old page are dropped, since they are non-functional links that
  render as unclickable styled text.
- `author_links` — optional map of author name to URL. Any name appearing as a key is rendered
  as a link; all other names render as plain text:

  ```yaml
  author_links:
    Yin Li: "https://www.biostat.wisc.edu/~yli/"
    Ryan McAdams: "https://www.pediatrics.wisc.edu/staff/mcadams-ryan/"
  ```

  The five URLs that exist today (Yin Li, Ryan McAdams, Patrick Peebles, Babak Naderi,
  Ross Cutler) carry over unchanged.
- `venue`, `year` — required. Rendered as italic venue followed by year.
- `media.type` — `image` or `video`. `video` triggers hover-to-play (the EPIC entry).
- `links` — ordered list, rendered separated by `/` as today.
- `blurb` — required, one-sentence description.

`title` links to the first entry in `links` when present, otherwise renders unlinked.

### `_data/news.yml`

```yaml
- date: "Sep 2026"
  text: "Our work on AI for neonatal intubation was covered in the media:
         <a href=\"...\">UW School of Medicine and Public Health</a>, ..."
```

`text` permits inline HTML because several entries contain links and `<i>`/`<b>` markup.
Entries are authored newest-first and rendered in file order — no sorting, since the display
dates are human strings, not parseable dates.

## Visual System

### Tokens (`assets/css/main.scss`)

Defined as CSS custom properties on `:root`, overridden under `[data-theme="dark"]`.

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#FAFAFA` | `#09090B` |
| `--surface` | `#FFFFFF` | `#18181B` |
| `--text` | `#18181B` | `#F4F4F5` |
| `--muted` | `#71717A` | `#A1A1AA` |
| `--accent` | `#4F46E5` | `#818CF8` |
| `--accent-hover` | `#0D9488` | `#2DD4BF` |
| `--border` | `#E4E4E7` | `#27272A` |

Dark-mode accents are lightened to hold contrast against the dark background. All text/background
pairs must meet WCAG AA (4.5:1 body, 3:1 large text).

### Typography

- Inter with a system-font fallback stack, self-hosted or via `font-display: swap`.
- Base size 16px, up from the current 14px.
- Fluid scale with `clamp()` for the name and section headings.

### Layout

- Content column `max-width: 800px`, matching the current measure.
- **Hero:** two-column grid (text left, round photo right), stacking under 640px.
- **News:** two-column grid, date in muted tabular numerals, right-aligned against the text.
- **Publications:** grid with fluid `aspect-ratio` thumbnail left and content right; stacks on
  mobile. Replaces the hardcoded 160px `.one`/`.two` boxes.

### Motion

- `IntersectionObserver` fade-up on section entry.
- ~150ms transitions on link and thumbnail hover.
- `scroll-behavior: smooth` for anchor nav.
- Every animation wrapped in a `prefers-reduced-motion: reduce` guard that disables it.

## Two Dark-Mode Fixes

Both follow from the user's choice to keep the footer widget and logo strip.

1. **Flag counter** has `bg_FFFFFF` baked into its URL, so it renders as a bright white
   rectangle on a dark page. Fix: two `<img>` tags with light and dark URL parameters,
   toggled by CSS on the theme attribute.
2. **Logo strip** (UW, Microsoft, Amazon, Health AI) is dark-on-transparent and would
   disappear on a dark background. Fix: a permanent soft neutral surface behind the strip in
   both themes. Reads as intentional and avoids per-logo inversion hacks.

## Pre-Existing Defects to Fix

These are in the markup being replaced, so fixing them is free:

- Stray unmatched `</p>` after the bio paragraph.
- `<ul>` wrapped in a `<p>`, closed by a stray `</p>` after `</ul>`.
- Unclosed and doubly-nested `<table>` elements throughout.
- Six empty `<a href="">` author links.
- Typo `Auotmatically` in the glottic-opening blurb.
- Typo `Syposium` in the SHINE conference news entry.
- Malformed media link text `Rockford News. </a>.` in the Sep 2026 news entry.
- Leading space in the npj Digital Medicine paper URL.

## Verification

1. `bundle exec jekyll build` completes with no warnings.
2. All three project sub-pages render correctly from `_site/`. Specifically confirm
   `deep_edm/index.html:209` — it contains a BibTeX `title = {{LETS} Forecast...}` that Liquid
   would misparse. Files without front matter are copied verbatim, so it should be safe;
   confirm the built byte output matches the source rather than assuming.
3. Every outbound link from the old page resolves: 7 publications, ~20 links, the CV PDF, and
   the 3 media links.
4. Screenshots at desktop and mobile widths, in both light and dark mode.
5. Content diff of old vs new rendered text, confirming nothing was silently dropped.
6. Theme toggle persists across reload; OS preference respected on first visit.

## Rollout

Work happens on a branch, not `master`. GitHub Pages serves `master`, so the live site is
untouched until the branch is reviewed and merged. Nothing is pushed until verification passes.

## Known Consequence

The landing page will be visually modern while the three project pages retain the old Barron
table style, so clicking through produces a style break. This was raised and accepted. Bringing
the project pages onto the same tokens is a clean follow-up if it becomes bothersome.
