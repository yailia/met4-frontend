import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string().optional(),
      date: z.coerce.date(),
      author: z.string(),
      category: z.string(),
      tags: z.array(z.string()).default([]),
      excerpt: z.string(),
      cover: image().optional(),
      readingMinutes: z.number().int().positive(),
      telegramId: z.number().int().optional(),
      hideFromHome: z.boolean().default(false),
    }),
});

export const collections = { blog };
