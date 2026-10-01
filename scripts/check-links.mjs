// Checks the product registry and article references, and exercises the /go/ redirect logic.
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { resolveClick } from '../functions/go/[[path]].js';

const products = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url)));
const categories = JSON.parse(readFileSync(new URL('../src/data/categories.json', import.meta.url)));
const slugs = new Set();
let errors = 0;
const fail = (m) => { console.error('✗', m); errors++; };

for (const p of products) {
  if (slugs.has(p.slug)) fail(`duplicate slug ${p.slug}`);
  slugs.add(p.slug);
  if (!/^https:\/\//.test(p.homepage)) fail(`${p.slug}: homepage must be https`);
  if (p.affiliateUrl && !/^https:\/\//.test(p.affiliateUrl)) fail(`${p.slug}: affiliateUrl must be https`);
  if (!categories[p.category]) fail(`${p.slug}: unknown category ${p.category}`);
}

const dir = new URL('../src/content/articles/', import.meta.url);
for (const f of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
  const m = readFileSync(new URL(f, dir), 'utf8').match(/^products:\s*\[(.*)\]/m);
  for (const s of (m?.[1] ?? '').split(',').map((x) => x.trim().replace(/"/g, '')).filter(Boolean))
    if (!slugs.has(s)) fail(`${f}: unknown product ${s}`);
}

// /go/ logic
const base = 'https://site.test';
let r = resolveClick(new URL(`${base}/go/kit/?src=pinterest&c=pin-01`), `${base}/comparisons/kit-vs-mailerlite/`, 'kit');
assert.equal(r.location, 'https://kit.com/');
assert.deepEqual(r.click, { product_slug: 'kit', article_path: '/comparisons/kit-vs-mailerlite/', source: 'pinterest', campaign: 'pin-01', link_type: 'fallback' });
r = resolveClick(new URL(`${base}/go/kit/`), `${base}/best/x/?utm_source=Pinterest&utm_campaign=c1`, 'kit');
assert.equal(r.click.source, 'pinterest'); assert.equal(r.click.campaign, 'c1');
r = resolveClick(new URL(`${base}/go/nope/`), null, 'nope');
assert.equal(r.location, `${base}/tools/`); assert.equal(r.product, null);
r = resolveClick(new URL(`${base}/go/kit/?src=<script>`), 'https://evil.test/', 'kit');
assert.equal(r.click.source, 'external'); assert.equal(r.click.article_path, null);

if (errors) { console.error(`${errors} problem(s)`); process.exit(1); }
console.log(`OK: ${products.length} products, redirect logic passes`);
