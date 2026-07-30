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

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    description: z.string(),
    h1: z.string(),
    format: z.string(),
    order: z.number().int().positive(),
    cardTitle: z.string(),
    cardText: z.string(),
    cardResult: z.string(),
    keywords: z.array(z.string()).default([]),
    faq: z
      .array(
        z.object({
          q: z.string(),
          a: z.string(),
        }),
      )
      .default([]),
  }),
});

export const collections = { blog, products };
