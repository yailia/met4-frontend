# SEO Product Pages — Design

Date: 2026-07-30
Status: approved (design), pending implementation

## Goal

Give each of the five MET4 work formats its own page that ranks in Yandex for
real commercial demand and converts the visitor into a diagnostic or a call.

## Problem

`/products` is a single page with five two-line cards. No page targets a search
query, no page carries an offer beyond a shared CTA pair. Organic weight for
product queries is zero.

## Scope

Two stages. Stage A (this spec's deliverable) = texts only. Stage B = Astro
implementation, started only after the user approves the texts.

## Stage A — page set

Five pages, one per existing format (1:1 with `/products` cards). Names in the
UI keep the current format wording as a subheading; H1 and title use query
language.

| Format card | Slug | H1 | Query cluster |
|---|---|---|---|
| Тренинг по устойчивости | `/products/profilaktika-vygoraniya/` | Корпоративный тренинг по профилактике выгорания сотрудников | профилактика выгорания сотрудников; тренинг выгорание персонала; как снизить выгорание в команде; эмоциональное выгорание сотрудников |
| Тренинг по продуктивности | `/products/upravlenie-stressom/` | Тренинг по управлению стрессом и продуктивности для команд | управление стрессом тренинг; стресс-менеджмент корпоративный; стрессоустойчивость сотрудников обучение; энергоменеджмент |
| Работа с поколением Z | `/products/pokolenie-z/` | Обучение руководителей работе с поколением Z | как работать с поколением Z; управление зумерами; адаптация молодых сотрудников; текучка среди зумеров |
| Коучинг руководителей | `/products/kouching-rukovoditeley/` | Коучинг для руководителей: устойчивость и ресурс лидера | коучинг для руководителей; executive коучинг; бизнес-коучинг для топ-менеджеров; выгорание руководителя |
| Индивидуальные планы развития | `/products/individualnye-plany-razvitiya/` | Индивидуальные планы развития сотрудников (ИПР) | индивидуальный план развития сотрудника; ИПР пример; программа развития ключевых сотрудников |

Competitors in the SERP (master-class.spb.ru, alter.ru/business,
hr-consulting.online, training-institute.ru, papagroup.ru, hrtime.ru) list
modules without numbers and without diagnostics. The differentiator to lead
with is the measurable result plus the free Q12 diagnostic.

## Stage A — page structure

Identical skeleton for all five pages:

```
H1 — query + audience
Lead, 2-3 sentences — business-language problem + outcome
CTA block #1 — "Пройти диагностику" / "Обсудить задачу"

H2 Кому подходит          — 4-5 bullets (HRD, manager, symptoms in the company)
H2 Какую проблему решает  — cause-effect chain: stress -> burnout -> turnover -> losses
H2 Что входит в программу — 4-6 modules, each: what we do + what changes
H2 Форматы и длительность — offline/online, group size, hours
H2 Результат              — measurable: eNPS, turnover, engagement, Q12
H2 Как проходит работа    — 4 steps: diagnostics -> programme -> sessions -> re-measure
H2 FAQ                    — 5-6 questions
CTA block #2 — final
```

Length: 900-1400 words per page. Top-ranking competitors sit at 600-1000.

Meta: `title` <= 60 chars with the key phrase plus "МЭТЧ"; `description`
150-160 chars carrying a benefit and a number.

Keyword density: exact match in H1, `title`, the first paragraph and one H2.
Everything else uses synonyms — Yandex penalises stuffing.

Voice follows `design-brief.md`: business outcome, not coaching vocabulary.

## Stage A — deliverable

Five markdown files in `docs/products/`, frontmatter already shaped for the
future Astro collection so Stage B does not rewrite text:

```yaml
---
slug: profilaktika-vygoraniya
title: "Тренинг по профилактике выгорания сотрудников — МЭТЧ"
description: "..."
h1: "Корпоративный тренинг по профилактике выгорания сотрудников"
format: "Групповой формат"
keywords: [...]
faq:
  - q: "..."
    a: "..."
---
```

Unknown facts (duration, group size, price, case numbers, expert names) are
written as `{{TODO: ...}}` placeholders for the user to fill.

## Stage B — implementation

Only after the user approves the texts.

- Content collection `products` in `frontend/src/content.config.ts`, texts moved
  from `docs/products/` into `frontend/src/content/products/`.
- Template `frontend/src/pages/products/[slug].astro` rendering the skeleton.
- Breadcrumbs: new component, none exist on the site today. Главная → Продукты →
  product.
- `/products` cards link to their pages; blog posts link in where topical.
- Sitemap picks up the new routes.

## Structured data (Yandex-oriented)

The site already uses JSON-LD: `Organization` in `index.astro`, `FAQPage` in
`FaqSection.astro`. Yandex has supported JSON-LD since 2021, but outside
`Article`/`BlogPosting` practitioners report Microdata is read more reliably —
so the two formats are split by entity:

| Entity | Format | Placement |
|---|---|---|
| `Service` (`provider` -> Organization, `serviceType`, `areaServed`, `audience`) | JSON-LD | each product page |
| `BreadcrumbList` | Microdata on the visible crumbs **and** JSON-LD | each product page |
| `FAQPage` / `Question` / `Answer` | Microdata on the visible FAQ | each product page |
| `Organization` | JSON-LD, moved into `BaseLayout` | every page (today: homepage only) |
| `Offer` | not used | without `price` Yandex builds no snippet and Webmaster reports errors |

Microdata must sit on visible text. Hidden FAQ markup risks a Yandex penalty.

Non-schema Yandex factors baked into the texts: exact key phrase in `<title>`,
LSI synonyms (Yandex weighs semantics over exact repetition), informational
depth for behavioural signals, internal links from the blog.

## Out of scope

- Pricing pages, YML feed, `Offer` markup.
- Rewriting `/products` layout beyond adding links.
- Paid keyword data — clusters come from SERP research; refine later if a
  Wordstat export appears.
