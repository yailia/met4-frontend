// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

if (process.argv.includes('build') && !process.env.PUBLIC_API_URL) {
  throw new Error('PUBLIC_API_URL env var is required for production build');
}

if (process.argv.includes('dev') && !process.env.PUBLIC_API_URL) {
  console.warn(
    '\n⚠️  PUBLIC_API_URL is not set — forms and the Q12 assessment will call "undefined/...".\n' +
    '   Start dev with the local API: PUBLIC_API_URL=http://localhost:3001 npm run dev\n'
  );
}

export default defineConfig({
  site: 'https://met4.ru',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    svelte(),
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        // /assessment holds hash-parameterized private links — keep out of the sitemap
        // (also Disallowed in robots.txt). 404 should never be indexed.
        if (path.startsWith('/assessment') || path === '/404/') return false;
        return true;
      },
      serialize(item) {
        item.changefreq = 'monthly';
        item.priority = item.url === 'https://met4.ru/' ? 1.0 : 0.7;
        return item;
      },
    })
  ]
});
