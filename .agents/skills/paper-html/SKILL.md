---
name: paper-html
description: >-
  Generate a self-contained, single-file HTML document in a warm editorial
  "paper" aesthetic — ivory paper background, near-black slate text, a
  clay-orange accent, serif headings over a sans body, and monospace labels.
  Use this whenever you are about to produce ANY standalone HTML page
  or document: a status/incident report, a design-system or component
  reference, a research/feature/concept explainer, an implementation plan or
  PR write-up, a slide deck, a flowchart, or any polished HTML deliverable the
  user will open in a browser or paste as an artifact. Reach for it even when
  the user just says "make an HTML page", "write this up as HTML", "turn this
  into a nice page/report/doc", or "give me a good-looking HTML" without naming
  a style — this is the house style. Skip it only when the user explicitly asks
  for a different design system, a specific brand's look, or a bare/unstyled
  HTML file.
---

# paper-html

Produce a single self-contained `.html` file with a calm, editorial, paper-like
feel: confident typography and restrained color on a warm ivory field. The goal is a page
that feels **designed and finished** the moment it opens — no build step, no
dependencies, no external assets.

## Non-negotiable constraints

These are what make the output portable and reliable, so honor them:

- **One file, no dependencies.** Everything inline: all CSS in a single
  `<style>` in `<head>`, any JS in an inline `<script>`. No CDN links, no
  external fonts, no external images. Use system font stacks and, when you need
  imagery or icons, inline SVG or emoji.
- **Start from the design tokens below.** Paste the `:root` block verbatim as
  the foundation, then build on it. Consistency across documents is the whole
  point — don't invent a new palette per page.
- **Semantic, hand-written CSS.** Plain classes named for meaning
  (`.stat-card`, `.risk-dot`, `.eyebrow`), not utility soup. It reads like a
  small bespoke stylesheet, because that's the aesthetic.

## The design tokens

This exact block is the shared DNA across every document. Begin here:

```css
:root {
  /* Core palette */
  --ivory:    #FAF9F5;  /* page background — warm off-white "paper" */
  --slate:    #141413;  /* primary text — near-black, never pure #000 */
  --clay:     #D97757;  /* the one accent — terracotta/clay orange */
  --oat:      #E3DACC;  /* soft filled surfaces, dividers */
  --olive:    #788C5D;  /* success / positive */

  /* Neutrals */
  --white:    #FFFFFF;
  --gray-100: #F0EEE6;  /* subtle fills, code chips, hover */
  --gray-300: #D1CFC5;  /* borders */
  --gray-500: #87867F;  /* muted / secondary text */
  --gray-700: #3D3D3A;  /* strong secondary text */

  /* Semantic accents (use sparingly) */
  --warning:  #C78E3F;
  --danger:   #B04A4A;
  --info:     #5C7CA3;

  /* Type */
  --serif: ui-serif, Georgia, 'Times New Roman', serif;
  --sans:  system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --mono:  ui-monospace, 'SF Mono', Menlo, Monaco, monospace;

  /* Shape */
  --radius-panel: 12px;
  --radius-row:   8px;
  --border: 1.5px solid var(--gray-300);

  /* Elevation — keep shadows faint; this is paper, not glass */
  --shadow-sm: 0 1px 2px rgba(20,20,19,0.06);
  --shadow-md: 0 4px 10px rgba(20,20,19,0.08);
  --shadow-lg: 0 12px 28px rgba(20,20,19,0.12);
}
```

## The look, in one breath

Think of a well-set page in a thoughtful print magazine, rendered in a browser.

- **Color is quiet.** The page is ivory, text is slate. `--clay` is the *single*
  accent — one clay element per view earns attention; ten fights itself. Use it
  for the primary action, a key number, a live indicator, a link. Semantic
  colors (olive/warning/danger/info) appear only to carry status meaning.
- **Type does the work.** Serif for headings and display — it's what gives the
  editorial feel. Sans for body and UI. Monospace for labels, metadata, code,
  tokens, and small ALL-CAPS eyebrows. Headings are `font-weight: 500` (not
  700) with slightly negative letter-spacing (`-0.01em` to `-0.02em`); they're
  large but never heavy.
- **Space is generous.** Center content in a `.page` container (typically
  `max-width: 720–1000px`, wider for dashboards). Let sections breathe with
  48–64px gaps. Cramped pages read as unfinished.
- **Borders over shadows.** Structure comes from hairline `1.5px` borders and
  8–12px radii on white cards sitting on the ivory field. Shadows stay whisper-
  faint (`--shadow-sm/md`) — reach for them rarely, mostly for something that
  genuinely floats.
- **Small mono labels everywhere.** Uppercase 11px monospace with wide letter-
  spacing (`0.06–0.08em`) in `--gray-500` for eyebrows, section kickers, and
  metadata. This one touch signals the aesthetic instantly.

## Baseline body + layout

Every page starts roughly like this (adapt the width to the content):

```css
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 56px 24px 96px;
  background: var(--ivory);
  color: var(--slate);
  font-family: var(--sans);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
.page { max-width: 900px; margin: 0 auto; }

h1 { font-family: var(--serif); font-weight: 500; font-size: 40px;
     letter-spacing: -0.02em; margin: 0 0 6px; line-height: 1.1; }
h2 { font-family: var(--serif); font-weight: 500; font-size: 26px;
     letter-spacing: -0.01em; margin: 0 0 8px; }

/* mono eyebrow / kicker — the signature label */
.eyebrow {
  font-family: var(--mono); font-size: 11px; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--gray-500); margin-bottom: 12px;
}

/* section divider */
hr.rule { border: none; border-top: 1px solid var(--gray-300); margin: 0 0 28px; }
```

A typical header pairs an eyebrow, a serif `h1`, and a muted sans sub-line. Wrap
each section in `<section>` with a serif `h2` + `hr.rule`, then the content.

## How to build a page

1. **Pick the width to the content.** A report or explainer reads best around
   720–900px. A design-system, dashboard, or multi-column tool can go
   960–1100px. Slides go full-viewport.
2. **Drop in the `:root` tokens and baseline body**, then set the header
   (eyebrow → serif title → muted sub-line).
3. **Compose from the component vocabulary** in
   [`references/components.md`](references/components.md) — cards, stat tiles,
   badges, tables, buttons, inputs, callouts, timelines, code blocks, KPI rows.
   Read that file when you need the exact markup/CSS for any of these; the
   snippets are copy-ready and already on-palette.
4. **Use real, specific-feeling content.** Concrete names, plausible numbers,
   and real prose make the design sing; lorem ipsum makes it look like a wire-
   frame. (Keep any sample data clearly fictional.)
5. **Spend the accent deliberately.** Before finishing, scan for clay overuse —
   if more than one or two things per screen are clay, demote the rest to slate,
   gray, or oat.

## Starting point

[`assets/template.html`](assets/template.html) is a minimal, ready-to-edit
skeleton with the tokens, baseline body, a header, and one sample section. Copy
it and build on it rather than assembling from scratch — but treat it as a
starting canvas, not a cage: add sections, components, and (where useful) small
inline JS interactions freely, all while staying inside the aesthetic above.

## Optional polish

- **Dark mode isn't part of the house style** — these documents are proudly
  light "paper." Only add a dark theme if the user asks.
- **Motion, if any, is subtle:** 0.12–0.2s ease transitions on hover/focus,
  gentle fades. Nothing bouncy.
- **Accessibility:** keep text on ivory/white at comfortable contrast (slate and
  gray-700 are safe; gray-500 is for secondary text only), label interactive
  elements, and keep focus states visible (the clay focus ring in components.md).
