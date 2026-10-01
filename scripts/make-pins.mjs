// Renders Pinterest pin images (1000x1500) from marketing/pins.json into public/pins/,
// and writes marketing/pins-bulk.csv for Pinterest's bulk upload (verify the column names in
// Pinterest's bulk-create dialog before uploading). Run: npm run pins
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { site } from '../src/site.config.mjs';

const root = new URL('..', import.meta.url);
const pins = JSON.parse(readFileSync(new URL('marketing/pins.json', root)));
const font = (w) => `data:font/woff2;base64,${readFileSync(new URL(`node_modules/@fontsource/poppins/files/poppins-latin-${w}-normal.woff2`, root)).toString('base64')}`;
const STYLES = {
  a: { bg: '#0f3d3e', fg: '#ffffff', accent: '#f4c95d', band: '#145c5e' },
  b: { bg: '#fdf3e7', fg: '#1d2b36', accent: '#e4572e', band: '#f6dfc3' },
  c: { bg: '#1d2b53', fg: '#ffffff', accent: '#7dd3fc', band: '#26386b' },
};
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const domain = new URL(site.url).hostname;

const html = (p) => {
  const s = STYLES[p.style] ?? STYLES.a;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:P;font-weight:500;src:url(${font(500)})}
  @font-face{font-family:P;font-weight:800;src:url(${font(800)})}
  html,body{margin:0;width:1000px;height:1500px}
  body{font-family:P;background:${s.bg};color:${s.fg};display:flex;flex-direction:column;box-sizing:border-box;padding:0 90px}
  main{flex:1;display:flex;flex-direction:column;justify-content:center}
  .kicker{font-weight:500;font-size:34px;letter-spacing:4px;text-transform:uppercase;color:${s.accent}}
  h1{font-weight:800;font-size:${p.headline.length > 30 ? 104 : 124}px;line-height:1.05;margin:40px 0 0}
  .bar{width:140px;height:14px;background:${s.accent};margin:56px 0 44px;border-radius:7px}
  .sub{font-weight:500;font-size:50px;line-height:1.3;opacity:.92}
  .cta{display:inline-block;margin-top:70px;background:${s.accent};color:${s.bg};font-weight:800;font-size:40px;padding:22px 40px;border-radius:60px}
  footer{margin:0 -90px;background:${s.band};padding:46px 90px;font-weight:500;font-size:36px;display:flex;justify-content:space-between}
  </style></head><body><main><div class="kicker">${esc(site.name)}</div><h1>${esc(p.headline)}</h1><div class="bar"></div>
  <div class="sub">${esc(p.sub)}</div><div><span class="cta">${esc(p.cta)} →</span></div></main>
  <footer><span>${esc(domain)}</span><span>Free guide</span></footer></body></html>`;
};

mkdirSync(new URL('public/pins/', root), { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1000, height: 1500 } });
for (const p of pins) {
  await page.setContent(html(p), { waitUntil: 'networkidle' });
  await page.screenshot({ path: new URL(`public/pins/${p.id}.png`, root).pathname });
}
await browser.close();

// Bulk-upload CSV: one pin every 2 days, so pins are spread out (Pinterest discourages bulk affiliate pinning).
const csvq = (v) => `"${String(v).replace(/"/g, '""')}"`;
const start = process.env.PIN_START ? new Date(process.env.PIN_START) : new Date(Date.now() + 864e5); // PIN_START=2026-11-01
start.setUTCHours(17, 0, 0, 0);
const rows = [['Title', 'Media URL', 'Pinterest board', 'Thumbnail', 'Description', 'Link', 'Publish date', 'Keywords']];
pins.forEach((p, i) => {
  const when = new Date(start); when.setUTCDate(start.getUTCDate() + i * 2);
  const link = new URL(p.article, site.url);
  link.search = new URLSearchParams({ utm_source: 'pinterest', utm_medium: 'social', utm_campaign: p.id });
  rows.push([p.pinTitle, new URL(`/pins/${p.id}.png`, site.url).href, p.board, '', p.description, link.href, when.toISOString().slice(0, 16), p.keyword]);
});
writeFileSync(new URL('marketing/pins-bulk.csv', root), rows.map((r) => r.map(csvq).join(',')).join('\n') + '\n');
console.log(`Rendered ${pins.length} pins to public/pins/ and wrote marketing/pins-bulk.csv`);
