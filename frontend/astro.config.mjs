// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://met4.ru',
  output: 'static',
  trailingSlash: 'always',
  integrations: [svelte(), sitemap()]
});
