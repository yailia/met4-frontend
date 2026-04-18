// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://met4.ru',
  output: 'static',
  trailingSlash: 'always',
  integrations: [svelte()]
});
