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
  integrations: [svelte(), sitemap()]
});
