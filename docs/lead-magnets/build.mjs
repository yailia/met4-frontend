import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(root, '../../frontend/public/guides');

const slug = process.argv[2];
if (!slug) {
  console.error('usage: node build.mjs <slug>');
  process.exit(1);
}

const source = join(root, slug, 'index.html');
if (!existsSync(source)) {
  console.error(`not found: ${source}`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const target = join(outDir, `${slug}.pdf`);

/** Running footer title comes from the guide's own <title>, minus the brand suffix. */
const docTitle = (readFileSync(source, 'utf8').match(/<title>([^<]+)<\/title>/) || [])[1] || slug;
const footerTitle = docTitle.replace(/\s*[—-]\s*МЭТЧ\s*$/, '').trim();

const footer = `
  <div style="width:100%;font-family:Inter,Segoe UI,sans-serif;font-size:8pt;color:#8b909c;
              padding:0 16mm;display:flex;justify-content:space-between;align-items:center;">
    <span>МЭТЧ · ${footerTitle}</span>
    <span class="pageNumber"></span>
  </div>`;

/**
 * playwright-core expects one exact Chromium build; the machine may already have
 * another one from a different Playwright install. Reuse whatever is on disk.
 */
function findLocalChromium() {
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH
    || join(process.env.LOCALAPPDATA || process.env.HOME || '', 'ms-playwright');
  if (!existsSync(cache)) return undefined;

  const candidates = readdirSync(cache)
    .filter((d) => d.startsWith('chromium_headless_shell-') || d.startsWith('chromium-'))
    .sort((a, b) => Number(b.split('-').pop()) - Number(a.split('-').pop()))
    .flatMap((d) => [
      join(cache, d, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe'),
      join(cache, d, 'chrome-win64', 'chrome.exe'),
      join(cache, d, 'chrome-win', 'chrome.exe'),
      join(cache, d, 'chrome-linux', 'chrome'),
      join(cache, d, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
    ]);

  return candidates.find((p) => existsSync(p));
}

const executablePath = findLocalChromium();
const browser = await chromium.launch(executablePath ? { executablePath } : {});
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(source).href, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: target,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: footer,
    margin: { top: '0mm', bottom: '14mm', left: '0mm', right: '0mm' },
  });
  console.log(`ok: ${target}`);
} finally {
  await browser.close();
}
