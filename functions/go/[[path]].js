// Cloudflare Pages Function: /go/<product-slug>/?src=...&c=...
// Looks the product up in the central registry, logs the click (optional) and redirects.
// Logged: product, article path, source, campaign, referrer host, country, time. No IP, no user agent, no cookies.
import products from '../../src/data/products.json' with { type: 'json' };

const SAFE = /^[a-z0-9._-]{1,80}$/i;
const clean = (v) => (v && SAFE.test(v) ? v.toLowerCase() : null);

export function resolveClick(url, referer, slug) {
  const product = products.find((p) => p.slug === slug);
  if (!product) return { location: new URL('/tools/', url).href, product: null };

  let articlePath = null, refSrc = null, refCamp = null;
  if (referer) {
    try {
      const r = new URL(referer);
      if (r.host === url.host) {
        articlePath = r.pathname.slice(0, 200);
        refSrc = r.searchParams.get('utm_source');
        refCamp = r.searchParams.get('utm_campaign');
      }
    } catch {}
  }
  const source = clean(url.searchParams.get('src')) ?? clean(refSrc) ?? (articlePath ? 'direct' : 'external');
  const campaign = clean(url.searchParams.get('c')) ?? clean(refCamp);
  return {
    product,
    location: product.affiliateUrl || product.homepage,
    click: {
      product_slug: product.slug,
      article_path: articlePath,
      source,
      campaign,
      link_type: product.affiliateUrl ? 'affiliate' : 'fallback',
    },
  };
}

export async function onRequestGet(context) {
  const { request, params, env } = context;
  const url = new URL(request.url);
  const slug = String([].concat(params.path ?? [])[0] ?? '').toLowerCase();
  const res = resolveClick(url, request.headers.get('Referer'), slug);

  if (res.product && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    const country = request.cf?.country ?? null;
    context.waitUntil(
      fetch(`${env.SUPABASE_URL}/rest/v1/clicks`, {
        method: 'POST',
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ ...res.click, country }),
      }).catch(() => {}),
    );
  }

  return new Response(null, {
    status: 302,
    headers: { Location: res.location, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });
}
