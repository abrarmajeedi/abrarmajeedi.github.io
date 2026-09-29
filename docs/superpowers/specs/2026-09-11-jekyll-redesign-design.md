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
| Structure | Single page, horizontal slide deck | Preserves current URLs; the nav switches panels instead of scrolling |
| CV | Rendered inline as its own panel | Requested; page images rather than an embedded PDF |
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
and native-extension builds against it are unreliable on current macOS. Ruby 3.3 specifically:
`github-pages` 232 declares `ruby >= 2.6, < 4.0`, so Ruby 4.x cannot install it, and the
version bundler falls back to on Ruby 4 (`github-pages` 223) ships liquid 4.0.3, which calls
`String#tainted?` — removed in Ruby 3.2 — and crashes on every build.

```
_config.yml                 site metadata, build config
Gemfile                     github-pages gem
index.html                  the four panels, each wrapping its includes
_layouts/default.html       html shell, theme bootstrap, full-bleed deck
_includes/
  head.html                 meta, fonts, favicon, OG tags
  nav.html                  sticky nav (drives the deck) + dark-mode toggle
  hero.html                 name, tagline, bio, links, logo strip
  research.html             research paragraph
  news.html                 renders _data/news.yml
  publications.html         renders _data/publications.yml
  cv.html                   PDF links + pre-rendered page images
  footer.html               flag counter, credit, copyright
images/cv/                  page-1.webp, page-2.webp (generated, committed)
_data/
  news.yml                  11 entries
  publications.yml          7 entries
  author_links.yml          coauthor name -> URL
assets/css/main.scss        design tokens + all styling
assets/js/theme.js          theme toggle + localStorage
archive/
  index_old.html            backup of current landing page
  stylesheet_old.css        backup of current stylesheet
```

Unchanged: `images/`, `data/`, `dualvision/`, `deep_edm/`, `rica2_aqa/`, `README.md`.

Deleted from root after backup: `index.html`, `stylesheet.css`.

**Why `index.html` must move:** the old `index.html` has no front matter, so Jekyll treats it as
a static file and copies it verbatim, ignoring any new landing page. Moving it to `archive/`
resolves the conflict and serves as the backup in one step. The new root page is also
`index.html` — with front matter this time — rather than `index.md`, because kramdown mangles
the raw HTML the includes emit.

`archive/` is listed in `exclude:`, so the backup lives in git but is **not** published to the
site. Recovering the old page means checking it out of the branch, not visiting a URL.

## Data Model

### `_data/publications.yml`

```yaml
- title: "DualVision: RGB–Infrared Multimodal Large Language Models for Robust Visual Reasoning"
  url: "https://abrarmajeedi.github.io/dualvision/"
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
- `_data/author_links.yml` — map of author name to URL, in its own file because
  `publications.yml` is a YAML sequence and a top-level mapping cannot be mixed into one.
  Any name appearing as a key is rendered as a link; all other names render as plain text:

  ```yaml
  Yin Li: "https://www.biostat.wisc.edu/~yli/"
  Ryan McAdams: "https://www.pediatrics.wisc.edu/staff/mcadams-ryan/"
  ```

  The five URLs that exist today (Yin Li, Ryan McAdams, Patrick Peebles, Babak Naderi,
  Ross Cutler) carry over unchanged.
- `venue`, `year` — required. Rendered as italic venue followed by year.
- `media.type` — `image` or `video`. `video` (the EPIC entry) autoplays muted on a loop, matching
  how the animated GIF on the LETS Forecast entry behaves. No JavaScript is involved: hover-to-play
  was tried first and left the thumbnail blank until hovered, since `preload="metadata"` fetches
  no frame to paint.

  Because it autoplays on every visit, the clip is re-encoded down from the 18s/1280x720/6.5 MB
  original to 1s/512x288/140 KB. The thumbnail renders at 170 CSS px, so 512 px still covers a 2x
  display; the two are indistinguishable at that size. To regenerate (ffmpeg lives in the
  `abrarmajeedi.github.io` conda env):

  ```
  ffmpeg -t 1 -i source.webm -c:v libvpx-vp9 -crf 36 -b:v 0 \
         -vf "scale=512:-2,fps=30" -an -deadline good -cpu-used 2 -row-mt 1 \
         images/epic_2022_video.webm
  ```
- `links` — ordered list, rendered separated by `/` as today.
- `blurb` — required, one-sentence description.

- `url` — optional. The title and the media thumbnail link here. An explicit field rather than
  "the first entry in `links`", because two entries need a title target that is not their first
  link: the npj paper and the EPIC challenge entry.

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
- **Thumbnails** use `object-fit: contain`, not `cover`. The figures run from 0.98:1 to 2.16:1,
  so cropping them to a shared box cut the edges off.

### The Slide Deck

The page is a horizontal deck of five panels: **Home** (bio, logo strip, the latest five news items), **Research**, **News** (every item),
**Publications**, **CV**. Clicking a nav link slides the whole page sideways to that panel while
the nav row stays put. Only the nav moves the deck; there is no separate tab strip.

Two earlier attempts were rejected by the user and are recorded so they are not retried:
a collapsing accordion behind each heading ("awful and looks old"), and a pill tab strip above a
pair of panels that slid a few rem sideways ("not in a cheap way like this").

Mechanics:

- The active panel is `position: relative`, so the deck's height is its height. Every other panel
  is `position: absolute` and `translateX(±100%)`, parked a full window width off to its side.
  The deck is full-bleed and clipped, so a panel travels the whole width on the way in and none
  of them can be reached sideways.
- Document order sets direction: a panel further down enters from the right, and the one it
  replaces leaves to the left. `theme.js` writes the side into a `--offset` custom property and
  commits it with a layout read before adding `.is-active`, otherwise a panel that has never been
  shown enters from whichever side it was parked on rather than the correct one.
- **The deck's height is not animated and not touched by JavaScript at all.** The active panel is
  the only one in flow, so CSS already sizes the deck to it. An earlier version transitioned the
  height in pixels, which changed the length of the document while a scroll was still running and
  left the reader in the middle of a panel or past the end of one. That was the whole of the
  reported bugginess.
- Only `transform` animates, so the scroll can be exact: `theme.js` measures the target after the
  switch and jumps to it with `behavior: 'auto'`, spelled out because `scroll-behavior: smooth` in
  the stylesheet applies to programmatic scrolls too. A link to a section of the panel already
  showing keeps the smooth scroll — nothing is moving for it to fight.
- Panels are parked with `visibility: hidden`, not merely transparent, which keeps their links out
  of the tab order. The flip is delayed by the length of the slide so a panel leaving stays visible
  on its way out.
- The deck is clipped with `overflow: clip`, with `overflow: hidden` underneath it as the fallback.
  `hidden` leaves the box scrollable, and the browser drags it sideways to reveal a parked panel
  whenever a fragment points into one, which displaces the whole deck permanently. Where only
  `hidden` is understood, `theme.js` listens for the deck scrolling and pulls it back.
- Nav links call `preventDefault()`: a parked panel is out of flow, so the browser's own jump
  would land nowhere. A link into the panel already
  showing is a plain scroll. Research is its own panel; it first lived on Home, which read as a
  duplicate next to the Research nav link.
- Deep links work. `/#cv` opens on that panel; the hash is kept current with `replaceState`, which
  avoids filling the back button with panel switches.
- **Without JavaScript the four panels stack down the page** in document order, every heading
  visible, exactly as the page read before the deck existed.

### The CV Panel

The CV is shown as pre-rendered page images, not an embedded PDF: browsers wrap an inline PDF in
their own dark viewer chrome, and most mobile browsers refuse to display one inline at all. Links
to open and download the real PDF sit above the pages, so the file stays the source of truth.

`cv.html` picks the images up from `site.static_files`, so adding a page to the CV needs no
template edit. To regenerate after replacing the PDF (poppler and ffmpeg both live in the
`abrarmajeedi.github.io` conda env):

```
pdftoppm -png -r 200 data/Abrar_Resume.pdf /tmp/p
ffmpeg -i /tmp/p-1.png -c:v libwebp -lossless 1 images/cv/page-1.webp
```

200 dpi gives 1700 px wide, about 2.2x the ~760 px column. Lossless is deliberate: for text on
white it is both sharper and smaller than any lossy setting worth using — 184 KB lossless against
286 KB at quality 70 for the same page. Both pages together come to 330 KB.

The tags carry `width="1700" height="2200"` so the browser reserves the box before the image
arrives, since the pages after the first are lazily loaded and would otherwise land with a jump.
`.cv-page` must then set `height: auto`: those attributes apply as CSS hints, and without the
override the page keeps its full pixel height and stretches to nearly 3x its correct size.

### Motion

- `IntersectionObserver` fade-up on section entry, on the Home panel only. The other panels are
  parked outside the viewport, where the observer cannot be relied on to fire as they slide in.
- Panel switches slide `transform` over 520ms. Nothing else about a switch is animated.
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

## Constraints Found During Implementation

- **Legacy sass.** GitHub Pages runs jekyll-sass-converter 1.5.2 / sass 3.7.4, which cannot parse
  `color-mix()` or space-separated `rgb(0 0 0 / 12%)`. Translucent values are written as plain
  `rgba()` in the `--nav-bg` and `--shadow` tokens.
- **`exclude:` replaces Jekyll's defaults** rather than appending to them, so `_config.yml` has to
  restate the standard entries alongside `archive/`, `vendor/`, and `.bundle/`. Without them
  Jekyll walks `vendor/bundle` and dies on a gem's `.markdown.erb` template.
- **The reveal animation is gated on a `.js` class** set by the head script. `.reveal { opacity: 0 }`
  unconditionally would render a blank page to any visitor whose JavaScript fails.
- **Affiliation logos keep a white background in both themes.** They are dark-on-transparent PNGs
  and become invisible on a dark surface. The CV page images get the same treatment.
- **The headless Chrome used for verification has three limits worth remembering.** It cannot
  decode the project's webm, it does not paint an embedded PDF's page area (though it does
  rasterize the viewer's thumbnails), and a `--window-size` narrower than the platform minimum
  lays the page out wider than it screenshots, which looks exactly like clipped text. Animation
  feel therefore has to be confirmed in a real browser; here the logic is checked by disabling
  transitions and asserting the start and end states, and mobile widths by measuring inside a
  fixed-width iframe.
- **The `grid-template-rows: 0fr -> 1fr` reveal trick resolves to `0px` in Chrome.** Recorded from
  the rejected accordion attempt; any future height animation needs a measured pixel target.
- **Never animate the height of a box while scrolling to something inside it.** The scroll
  destination is computed against a length that is still changing, so it lands somewhere arbitrary,
  and if the box shrinks the browser clamps the scroll and never returns. This is why the deck's
  height is left to CSS.
- **`overflow: hidden` is still a scroll container.** Anything the browser wants to reveal inside
  it — a fragment target, a focused link, a find-in-page match — it reveals by scrolling the box,
  and nothing puts it back. `overflow: clip` is the version that only clips.
- **Headless Chrome does not advance smooth scrolling either**, on top of not advancing CSS
  transitions. Verification harnesses have to disable `scroll-behavior` *and* override
  `window.scrollTo` to force `behavior: 'auto'`, since the page requests smooth scrolling in
  JavaScript, where a stylesheet override cannot reach it.
- **`jekyll serve` is left running in the background from earlier in the session and watches the
  tree**, so every source edit rebuilds and wipes `_site`, taking any verification harness written
  there with it. Write the harness, then run it, without editing a source file in between.

## Rollout

Work happens on a branch, not `master`. GitHub Pages serves `master`, so the live site is
untouched until the branch is reviewed and merged. Nothing is pushed until verification passes.

## Known Consequence

The landing page will be visually modern while the three project pages retain the old Barron
table style, so clicking through produces a style break. This was raised and accepted. Bringing
the project pages onto the same tokens is a clean follow-up if it becomes bothersome.
