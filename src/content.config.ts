import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const SECTIONS = ['guides', 'best', 'comparisons', 'alternatives', 'reviews'] as const;

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().optional(),
    description: z.string().max(160),
    section: z.enum(SECTIONS),
    products: z.array(z.string()).default([]),   // slugs from src/data/products.json
    primaryKeyword: z.string(),
    draft: z.boolean().default(true),            // nothing is published until a human sets draft: false
    reviewedBy: z.string().optional(),
    published: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  }),
});

export const collections = { articles };
