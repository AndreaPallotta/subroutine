import { defineCollection, z } from 'astro:content';

const articlesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.enum(['Algorithms', 'Systems', 'AI & ML', 'Languages', 'Physics & Math', 'Networking', 'Security']),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  articles: articlesCollection,
};
