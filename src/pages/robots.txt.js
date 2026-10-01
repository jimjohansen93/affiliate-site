import { site } from '../site.config.mjs';
export function GET() {
  return new Response(`User-agent: *\nDisallow: /go/\nSitemap: ${new URL('/sitemap-index.xml', site.url).href}\n`, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
