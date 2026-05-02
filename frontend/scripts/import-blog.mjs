// Import Telegram channel export -> Astro content collection /src/content/blog/
// Usage: node scripts/import-blog.mjs

import * as cheerio from 'cheerio';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { join, basename, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EXPORT_DIR = 'C:/Users/bolku/Downloads/Telegram Desktop/ChatExport_2026-04-20';
const HTML_FILE = join(EXPORT_DIR, 'messages.html');
const OUT_BLOG = join(ROOT, 'src/content/blog');
const OUT_IMG_BASE = join(OUT_BLOG, '_images');

// Wipe outputs (safe — collection only)
if (existsSync(OUT_BLOG)) rmSync(OUT_BLOG, { recursive: true, force: true });
mkdirSync(OUT_IMG_BASE, { recursive: true });

// ---------- Transliteration (RU -> kebab) ----------
const TRANSLIT = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i',
  'й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t',
  'у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'',
  'э':'e','ю':'yu','я':'ya'
};
function slugify(str) {
  let s = (str || '').toLowerCase();
  let out = '';
  for (const ch of s) out += TRANSLIT[ch] ?? ch;
  out = out.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (out.length > 60) {
    out = out.slice(0, 60).replace(/-[^-]*$/, '');
  }
  return out || 'post';
}

// ---------- Date parser ----------
// "19.09.2024 19:33:08 UTC+03:00" -> ISO
function parseDate(title) {
  if (!title) return null;
  const m = title.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s+UTC([+-]\d{2}):(\d{2})/);
  if (!m) return null;
  const [, dd, mm, yyyy, h, mi, s, tzH, tzM] = m;
  // Convert to UTC: subtract offset
  const local = new Date(Date.UTC(+yyyy, +mm - 1, +dd, +h, +mi, +s));
  const offsetMin = (Number(tzH) * 60 + (tzH.startsWith('-') ? -Number(tzM) : Number(tzM))) * 1;
  // local time was wall clock at that offset; UTC = wall - offset
  const utc = new Date(local.getTime() - offsetMin * 60 * 1000);
  return utc;
}

// ---------- Text extraction from <div class="text"> ----------
function textNodeToMarkdown($, node) {
  let out = '';
  $(node).contents().each((_, el) => {
    if (el.type === 'text') {
      out += el.data;
    } else if (el.type === 'tag') {
      const t = el.tagName;
      const $el = $(el);
      const inner = textNodeToMarkdown($, el);
      if (t === 'br') {
        out += '\n';
      } else if (t === 'strong' || t === 'b') {
        out += inner ? `**${inner.trim()}**` : '';
      } else if (t === 'em' || t === 'i') {
        out += inner ? `*${inner.trim()}*` : '';
      } else if (t === 'code') {
        out += inner ? `\`${inner.trim()}\`` : '';
      } else if (t === 'a') {
        const href = $el.attr('href') || '';
        const onclick = $el.attr('onclick') || '';
        // Hashtag click handler -> #tag text
        if (onclick.includes('ShowHashtag')) {
          out += inner; // already "#xxx"
        } else if (href.startsWith('stickers/') || href.startsWith('video_files/sticker') || /\.(webp|tgs|webm)$/.test(href)) {
          // Strip sticker wrappers, keep emoji inside
          out += inner;
        } else if (href === '' || href === '#') {
          out += inner;
        } else {
          const cleaned = inner.trim();
          if (cleaned) {
            out += `[${cleaned}](${href})`;
          }
        }
      } else if (t === 'span') {
        // spoilers etc — keep inner
        out += inner;
      } else {
        out += inner;
      }
    }
  });
  return out;
}

function normalizeText(txt) {
  // Collapse 3+ newlines to 2; trim each line; remove leading/trailing
  let lines = txt.split('\n').map((l) => l.replace(/[ \t]+$/g, ''));
  // collapse runs of empty lines
  const out = [];
  let blank = 0;
  for (const l of lines) {
    if (l.trim() === '') {
      blank++;
      if (blank <= 1) out.push('');
    } else {
      blank = 0;
      out.push(l);
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function stripMd(s) {
  return s.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- Author detection ----------
function detectAuthor(text) {
  const t = text.toLowerCase();
  const elenaScore =
    (t.match(/кпт[\s-]?психолог/g)?.length || 0) * 3 +
    (t.match(/когнитивно[\s-]поведенческ/g)?.length || 0) * 3 +
    (t.match(/как кпт/g)?.length || 0) * 2 +
    (t.match(/елен[аы]/g)?.length || 0);
  const ekaterinaScore =
    (t.match(/hrd|эйчар|10 лет в hr|directorhr/g)?.length || 0) * 3 +
    (t.match(/well[\s-]being/g)?.length || 0) * 2 +
    (t.match(/екатерин[аы]|катя|катер/g)?.length || 0);
  if (elenaScore >= 3 && elenaScore > ekaterinaScore) return 'Елена Ривовна Иванова';
  if (ekaterinaScore >= 3 && ekaterinaScore > elenaScore) return 'Екатерина Чепурных';
  return 'МЭТЧ';
}

// ---------- Title generation ----------
function pickTitleSource(body) {
  const plain = stripMd(body);
  // Try first line
  const firstLine = body.split('\n').map(stripMd).find((l) => l.trim().length > 0) || plain;
  // Heading-like: short, no period at end, capitalized
  if (firstLine.length >= 8 && firstLine.length <= 90 && !/[.!?:]$/.test(firstLine.trim())) {
    return firstLine.trim();
  }
  // First sentence
  const m = plain.match(/^(.{20,120}?)([.!?])/);
  if (m) {
    let t = m[1].trim();
    if (t.length > 80) t = t.slice(0, 78).replace(/[\s,;:]+\S*$/, '') + '…';
    return t;
  }
  // Fallback: first 60 chars
  return plain.slice(0, 60).trim() || 'Запись';
}

function seoifyTitle(raw, category, tags) {
  let t = raw.trim();
  // Strip leading hashtags/emojis at start
  t = t.replace(/^#\S+\s*/, '');
  t = t.replace(/^[^\p{L}\p{N}«"]+/u, '');
  // If it ends with weird punctuation
  t = t.replace(/[\s—–\-]+$/g, '');
  // Cap length 65
  if (t.length > 65) t = t.slice(0, 63).replace(/[\s,;:]+\S*$/, '') + '…';
  // Capitalize first
  if (t.length > 0) t = t[0].toUpperCase() + t.slice(1);
  return t;
}

// ---------- Categorization ----------
const CAT_RULES = [
  { name: 'Выгорание', weight: 1.5, kw: [/выгоран/gi, /истощен/gi, /переработ/gi, /восстановлен/gi, /ресурс[ауеоы]?/gi, /отдых/gi, /отпуск/gi, /сон/gi, /усталост/gi] },
  { name: 'Эмоциональный интеллект', weight: 1.4, kw: [/эмоци/gi, /чувств/gi, /осознан/gi, /регуляц/gi, /триггер/gi, /эмпати/gi, /злост/gi, /страх/gi, /тревог/gi, /стресс/gi, /майндфулнес/gi, /\bкпт\b/gi, /терап/gi, /психолог/gi] },
  { name: 'HR-практики', weight: 1.0, kw: [/\bHRD?\b/g, /\bHR[\s-]/g, /найм/gi, /адаптац/gi, /оценк[аи] персонал/gi, /performance/gi, /компетенц/gi, /well[\s-]?being/gi, /велбин/gi, /Q12/g, /опросник/gi, /диагностик/gi, /Gallup/gi, /гэллап/gi] },
  { name: 'Поколения и команды', weight: 1.6, kw: [/gen\s?z/gi, /поколен/gi, /молодёж/gi, /миллениал/gi, /зумер/gi, /бумер/gi, /команд[ауыеои]/gi, /руководител/gi, /начальник/gi, /босс/gi, /конфликт/gi, /коллег/gi] },
  { name: 'Карьера и удержание', weight: 1.4, kw: [/карьер/gi, /удержан/gi, /увольн/gi, /мотивац/gi, /стажиров/gi, /развити[ея] сотрудник/gi, /рост сотрудник/gi, /собеседован/gi] },
  { name: 'Кейсы и события', weight: 2.0, kw: [/тренинг провед/gi, /мы провели/gi, /провели тренинг/gi, /мастер[\s-]?класс/gi, /выступал/gi, /конференц/gi, /форум/gi, /\bкейс\b/gi, /\bкейс[еауы]/gi, /митап/gi, /спикер/gi] },
];
function pickCategory(text) {
  const scores = CAT_RULES.map(({ name, weight, kw }) => ({
    name,
    score: kw.reduce((s, r) => s + (text.match(r)?.length || 0), 0) * weight,
  }));
  scores.sort((a, b) => b.score - a.score);
  if (scores[0].score === 0) return 'HR-практики';
  return scores[0].name;
}

// ---------- Tags ----------
const TAG_RULES = [
  ['Q12', /\bQ\s?12\b/i],
  ['assessment', /assessment|опросник|оценка персонал/i],
  ['Выгорание', /выгоран/i],
  ['КПТ', /\bкпт\b|когнитивно[\s-]поведенческ/i],
  ['Майндфулнес', /майндфулнес|mindfulness/i],
  ['Тревога', /тревог/i],
  ['Gen Z', /gen\s?z|поколение z/i],
  ['Мотивация', /мотивац/i],
  ['HRD', /\bHRD\b/i],
  ['Well-being', /well[\s-]being|велбин/i],
  ['Gallup', /gallup|гэллап/i],
  ['Вовлечённость', /вовлеч(ё|е)нност/i],
  ['Корпоративная культура', /корпоративн[ао]я культур/i],
  ['Обратная связь', /обратн[ао]я связ/i],
  ['Границы', /\bграниц/i],
  ['Токсичность', /токсичн/i],
  ['Управление', /управлен/i],
  ['Онбординг', /онбординг|onboarding/i],
  ['Адаптация', /адаптац/i],
  ['Эмоциональный интеллект', /эмоциональн[ыо]й интеллект|\bEQ\b/i],
];
function pickTags(text, body) {
  const tags = new Set();
  for (const [name, re] of TAG_RULES) {
    if (re.test(text)) tags.add(name);
    if (tags.size >= 4) break;
  }
  // Announce detection
  const announce =
    /(приглаша(ем|ю|ет)|регистрац|состоится|приходите|ждём вас|ждем вас|вебинар [0-9]|открыта запись|только сегодня|завтра в \d)/i.test(text)
    || stripMd(body).length < 200;
  if (announce) tags.add('Анонс');
  return [...tags].slice(0, 5);
}

// ---------- Internal SEO links ----------
function autoLink(body) {
  const rules = [
    { re: /(оценка|оценку|оценки|Q12|Q\s12|диагностик[аиу]|опросник|опросника)/i, url: '/assessment/' },
    { re: /(вебинар[аеу]?|разбор[еау]?|мастер[\s-]?класс[еау]?)/i, url: '/webinar/' },
    { re: /(тренинг[еау]?|программ[аыу]|курс[еау]?)/i, url: '/products/' },
    { re: /(Екатерин[аы]|Елен[аы]|нашей команд[ыеу]|нашу команд[ыу])/i, url: '/team/' },
  ];
  // Apply only OUTSIDE existing markdown links and code spans.
  // Approach: walk paragraphs; for each rule, replace first occurrence.
  let text = body;
  for (const { re, url } of rules) {
    let replaced = false;
    text = text.replace(/(\[[^\]]*\]\([^)]*\))|(`[^`]*`)|([^\[`]+)/g, (m, ml, code, plain) => {
      if (replaced) return m;
      if (ml || code) return m;
      const local = plain.replace(re, (match) => {
        if (replaced) return match;
        replaced = true;
        return `[${match}](${url})`;
      });
      return local;
    });
  }
  return text;
}

// ---------- Reading time ----------
function readingMinutes(plain) {
  const words = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

// ---------- Image copy ----------
function copyImage(srcRel, slug, idx) {
  const src = join(EXPORT_DIR, srcRel);
  if (!existsSync(src)) return null;
  const dir = join(OUT_IMG_BASE, slug);
  mkdirSync(dir, { recursive: true });
  const ext = extname(srcRel) || '.jpg';
  const name = idx === 0 ? `cover${ext}` : `img-${idx}${ext}`;
  const dst = join(dir, name);
  copyFileSync(src, dst);
  return `./_images/${slug}/${name}`;
}


// ---------- Main parse ----------
const html = readFileSync(HTML_FILE, 'utf8');
const $ = cheerio.load(html);

const messages = $('.message.default').toArray();
console.log(`Found ${messages.length} messages.`);

const posts = [];
const slugSet = new Set();
const skipped = [];

for (const msg of messages) {
  const $msg = $(msg);
  const id = ($msg.attr('id') || '').replace('message', '');
  const dateTitle = $msg.find('.pull_right.date.details').first().attr('title') || '';
  const date = parseDate(dateTitle);
  const $text = $msg.find('.body > .text').first();
  const $photoLinks = $msg.find('a.photo_wrap');
  const $videoLinks = $msg.find('a.video_file_wrap');

  // Skip pure-sticker messages
  if (!$text.length && !$photoLinks.length && !$videoLinks.length) {
    skipped.push({ id, reason: 'no text/photo/video' });
    continue;
  }
  // Skip if message contains only a sticker
  const stickerOnly = $msg.find('.media_wrap > .sticker, .media > .sticker').length > 0
    && !$text.length && !$photoLinks.length && !$videoLinks.length;
  if (stickerOnly) {
    skipped.push({ id, reason: 'sticker only' });
    continue;
  }

  let body = '';
  if ($text.length) {
    body = textNodeToMarkdown($, $text[0]);
    body = normalizeText(body);
  }

  // Build photos / videos arrays
  const photos = $photoLinks.toArray().map((a) => $(a).attr('href')).filter(Boolean);
  const videos = $videoLinks.toArray().map((a) => $(a).attr('href')).filter(Boolean);

  if (!body && photos.length === 0 && videos.length === 0) {
    skipped.push({ id, reason: 'empty after parse' });
    continue;
  }
  if (!body) {
    skipped.push({ id, reason: 'media-only (no text)' });
    continue;
  }
  if (videos.length > 0) {
    skipped.push({ id, reason: 'has video (excluded)' });
    continue;
  }

  // Title
  const rawTitle = pickTitleSource(body);
  const cat0 = pickCategory(stripMd(body) + ' ' + rawTitle);
  const tags0 = pickTags(stripMd(body) + ' ' + rawTitle, body);
  const seoTitle = seoifyTitle(rawTitle, cat0, tags0);

  // Slug (handle collisions)
  let slug = slugify(seoTitle);
  if (!slug || slug === 'post') slug = `post-${id}`;
  let trySlug = slug;
  let n = 2;
  while (slugSet.has(trySlug)) { trySlug = `${slug}-${n++}`; }
  slug = trySlug;
  slugSet.add(slug);

  // Body: drop the line we used as title (only if it's the first line and matches)
  let bodyClean = body;
  if (body) {
    const lines = body.split('\n');
    const idxOfTitleLine = lines.findIndex((l) => stripMd(l).trim() === stripMd(rawTitle).trim());
    if (idxOfTitleLine >= 0 && idxOfTitleLine <= 1) {
      lines.splice(idxOfTitleLine, 1);
      bodyClean = lines.join('\n').replace(/^\n+/, '');
    }
  }

  // Copy media
  let cover = null;
  const mdMedia = [];
  photos.forEach((p, i) => {
    const rel = copyImage(p, slug, i);
    if (rel) {
      if (i === 0) cover = rel;
      else mdMedia.push(`![фото](${rel})`);
    }
  });

  // Append additional media after body
  if (mdMedia.length) {
    bodyClean = (bodyClean ? bodyClean + '\n\n' : '') + mdMedia.join('\n\n');
  }

  // Auto-link first occurrences
  bodyClean = autoLink(bodyClean);

  // Excerpt
  const plain = stripMd(bodyClean);
  let excerpt = plain.slice(0, 180);
  if (plain.length > 180) {
    excerpt = excerpt.replace(/\s+\S*$/, '') + '…';
  }
  excerpt = excerpt.trim();
  if (!excerpt) excerpt = seoTitle;

  // Author
  const author = detectAuthor((bodyClean || '') + ' ' + seoTitle);

  // Reading time
  const rt = readingMinutes(plain);

  posts.push({
    id, slug, seoTitle, date, author,
    category: cat0, tags: tags0, excerpt, cover, rt,
    body: bodyClean,
  });
}

// Sort by date asc (so we can assign reasonable order; we'll sort desc on site)
posts.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

// ---------- Write markdown files ----------
function yamlEscape(s) {
  if (s == null) return '';
  return String(s).replace(/"/g, '\\"');
}

let written = 0;
const catCount = {};
let photosCopied = 0;
let videosCopied = 0;
for (const p of posts) {
  const fm = [
    '---',
    `title: "${yamlEscape(p.seoTitle)}"`,
    `slug: "${p.slug}"`,
    `date: ${p.date ? p.date.toISOString() : new Date(0).toISOString()}`,
    `author: "${yamlEscape(p.author)}"`,
    `category: "${yamlEscape(p.category)}"`,
    `tags: [${p.tags.map((t) => `"${yamlEscape(t)}"`).join(', ')}]`,
    `excerpt: "${yamlEscape(p.excerpt)}"`,
    p.cover ? `cover: "${p.cover}"` : '',
    `readingMinutes: ${p.rt}`,
    `telegramId: ${Number(p.id) || 0}`,
    '---',
    '',
    p.body,
    '',
  ].filter((l) => l !== '').join('\n');

  const file = join(OUT_BLOG, `${p.slug}.md`);
  writeFileSync(file, fm, 'utf8');
  written++;
  catCount[p.category] = (catCount[p.category] || 0) + 1;
}

// Count copied media (recursive over _images)
import { readdirSync, statSync } from 'node:fs';
function walk(dir) {
  let n = 0;
  for (const f of readdirSync(dir)) {
    const fp = join(dir, f);
    const st = statSync(fp);
    if (st.isDirectory()) n += walk(fp);
    else n++;
  }
  return n;
}
const mediaCount = existsSync(OUT_IMG_BASE) ? walk(OUT_IMG_BASE) : 0;

console.log('---');
console.log(`Wrote ${written} posts.`);
console.log('Category distribution:');
for (const [k, v] of Object.entries(catCount).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}
console.log(`Media files copied: ${mediaCount}`);
console.log(`Skipped: ${skipped.length}`);
if (skipped.length) {
  const reasons = {};
  for (const s of skipped) reasons[s.reason] = (reasons[s.reason] || 0) + 1;
  for (const [r, n] of Object.entries(reasons)) console.log(`  ${r}: ${n}`);
}
console.log('Sample slugs:');
for (const p of posts.slice(-5)) console.log(`  /blog/${p.slug}/  — ${p.seoTitle}  [${p.category}]`);
