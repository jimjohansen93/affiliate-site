import products from '../data/products.json';
import categories from '../data/categories.json';
import { getCollection } from 'astro:content';

export { products, categories };

export const SECTION_LABELS = {
  guides: 'Guides',
  best: 'Best tools',
  comparisons: 'Comparisons',
  alternatives: 'Alternatives',
  reviews: 'Reviews',
};

export function getProduct(slug) {
  const p = products.find((x) => x.slug === slug);
  if (!p) throw new Error(`Unknown product slug "${slug}" – add it to src/data/products.json`);
  return p;
}

// Drafts are visible in `astro dev` only, never in a production build.
export async function getArticles(section) {
  const all = await getCollection('articles', ({ data }) => import.meta.env.DEV || !data.draft);
  return all
    .filter((a) => !section || a.data.section === section)
    .sort((a, b) => (b.data.updated ?? b.data.published ?? 0) - (a.data.updated ?? a.data.published ?? 0));
}
