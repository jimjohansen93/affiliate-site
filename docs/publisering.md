# Slik publiserer vi siden (Cloudflare Pages)

Gjøres **én gang**, når domenet leancreatorstack.com er kjøpt hos Cloudflare. Tar ca. 10 minutter.
Navnene i Cloudflare-menyen kan endre seg litt – Cloudflare har slått sammen «Pages» og «Workers».

1. Logg inn på dash.cloudflare.com.
2. Gå til **Workers & Pages** → **Create** → fanen **Pages** → **Connect to Git**.
3. Koble til GitHub og velg repoet **affiliate-site**.
4. Innstillinger:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node-versjon: hentes automatisk fra filen `.nvmrc` (Node 22)
5. Klikk **Save and Deploy**. Etter et par minutter får du en adresse som slutter på `.pages.dev` – send den til meg, så sjekker jeg at alt fungerer.
6. Gå til prosjektet → **Custom domains** → **Set up a custom domain** → skriv `leancreatorstack.com`. Fordi domenet ligger hos Cloudflare, settes resten opp automatisk.

Etter dette publiseres siden automatisk hver gang jeg laster opp endringer til GitHub.

## Senere (ikke nødvendig nå)

- **Cloudflare Web Analytics** (gratis): viser besøkstall. Slås på under prosjektets innstillinger. Vi verifiserer at det ikke krever cookie-samtykke før vi slår det på.
- **Supabase** (gratis): lagrer klikk på affiliate-lenker. Settes opp når vi har trafikk; nøklene legges inn som miljøvariabler i Cloudflare, aldri i koden.
