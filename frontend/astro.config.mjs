// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  site: 'https://yailia.github.io',
  base: '/met4-frontend',
  output: 'static',
  integrations: [svelte()]
});