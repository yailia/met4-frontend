# Lead-magnet PDF pipeline — design

Date: 2026-07-30
Status: approved

## Goal

Turn the raw "50 вопросов для One-to-One" PDF into a МЭТЧ-branded PDF, built from an HTML
source, using a pipeline reusable for every future guide in the upcoming `/guides` section.

## Scope

In scope:
- Reusable build pipeline (HTML + shared CSS → PDF).
- One guide: `one-to-one-50-questions`.
- Copy edit of the existing text (tone, typos), no new content invented.

Out of scope (separate specs):
- `/guides` list and detail pages on the site.
- Email gate / delivery of the PDF.

## Architecture

```
docs/lead-magnets/
  package.json                       # single devDep: playwright-core
  build.mjs                          # node build.mjs <slug>
  _shared/guide.css                  # brand tokens, cover, cards, markers, footer, final spread
  _shared/assets/                    # logo, expert photos (copied from frontend/src/assets)
  one-to-one-50-questions/index.html # content only
```

Output: `frontend/public/guides/<slug>.pdf`

Adding a guide = adding one `index.html`. No CSS changes expected.

### Build

`build.mjs` loads `docs/lead-magnets/<slug>/index.html` via `file://` in Chromium
(`playwright-core`, reusing the already-installed browser in
`%LOCALAPPDATA%/ms-playwright`), then `page.pdf()` with:

- format A4, `printBackground: true`
- `displayHeaderFooter: true` with a custom `footerTemplate`
- margins sized so the footer never collides with content

Pages that must be edge-to-edge dark (cover, final spread) opt out of the footer via a
`.page--full` class that paints its own full-bleed background.

Script exits non-zero on a missing slug, missing `index.html`, or a Chromium launch failure.

### Style

Tokens mirror `frontend/src/styles/globals.css`:

| Role | Value |
|---|---|
| Dark surface (cover, final) | `#24272e` |
| Body background | `#ffffff` |
| Body text | `#24272e` |
| Muted text | `#5b606b` |
| Accent | `#9669d8` |
| Accent soft (action panels) | `rgba(150,105,216,0.12)` |
| Marker green / amber / red | `#3f8f6b` / `#d9a441` / `#c85b5b` |

Font: Inter if available on the system, falling back to a system sans stack. No webfont
fetching — the build must work offline.

Print rules: `break-inside: avoid` on question cards, `break-after: page` on block openers,
no orphan headings.

## Document structure

| Page | Content | Style |
|---|---|---|
| 1 | Cover: logo, title, "Практическое руководство руководителя", met4.ru | dark |
| 2 | How to use: the 80/20 rule, marker legend (Норма / Риск / SOS) | light |
| 3 | Table of contents: 5 blocks | light |
| 4–9 | 50 questions in 5 blocks | light |
| 10 | 1-on-1 checklist | light |
| 11 | Final: CTA to `/assessment`, founders, contacts | dark |

Question card anatomy: number, question, "Зачем задавать", marker rows (where the source has
them), and a "Что делать руководителю" panel on accent-soft.

## Links and UTM

All met4.ru links carry:

```
?utm_source=guide&utm_medium=pdf&utm_campaign=one-to-one-50&utm_content=<slot>
```

`<slot>` is one of `cover`, `intro`, `cta_final`, `footer`. Telegram (`t.me/met4_ru`) and
`mailto:hello@met4.ru` stay clean — neither carries UTM.

## Copy edit rules

- Keep all 50 questions and their meaning unchanged.
- Business tone per `design-brief.md`: measurable outcomes, no coaching jargon.
- Fix typos in the source: "передайте задача стажеру", "статуску".
- Keep working anglicisms (SLA, decision fatigue, boreout) where they carry meaning.
- The final CTA already points at Gallup Q12 — reframe it as МЭТЧ's `/assessment`.

## Verification

- `node build.mjs one-to-one-50-questions` exits 0 and writes the PDF.
- Rendered page count is 10–12; no card is split across a page break.
- Every met4.ru link in the PDF is clickable and carries its UTM slot.
- Both founder photos and the logo render (no missing-asset boxes).
- Printed greyscale: marker rows stay distinguishable by label, not colour alone.
