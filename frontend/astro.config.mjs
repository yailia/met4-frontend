// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

if (process.argv.includes('build') && !process.env.PUBLIC_API_URL) {
  throw new Error('PUBLIC_API_URL env var is required for production build');
}

export default defineConfig({
  site: 'https://met4.ru',
  output: 'static',
  trailingSlash: 'always',
  integrations: [svelte(), sitemap()]
});
