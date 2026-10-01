-- Affiliate database. Run in the Supabase SQL editor (or `supabase db push`).
-- Row Level Security is on and no public policies are created: only the service role
-- (used server-side by the /go/ function and by import scripts) can read or write.

create table affiliate_programs (
  id            bigint generated always as identity primary key,
  name          text not null,
  network       text,                       -- PartnerStack, Impact, In-house ...
  commission    text,
  recurring     text,                       -- 'lifetime', '12 months', 'no'
  cookie_days   int,
  min_payout    text,
  terms_url     text,
  status        text not null default 'not_applied', -- not_applied | applied | approved | rejected | closed
  last_verified date,
  notes         text
);

create table products (
  slug          text primary key,           -- same slug as src/data/products.json and /go/<slug>/
  name          text not null,
  company       text,
  category      text,
  program_id    bigint references affiliate_programs(id),
  homepage      text not null,
  affiliate_url text,                       -- the ONE place the affiliate link lives
  price_from    text,
  active        boolean not null default true
);

create table articles (
  slug          text primary key,
  section       text not null,              -- guides | best | comparisons | alternatives | reviews
  title         text not null,
  primary_keyword text,
  status        text not null default 'draft', -- draft | in_review | published
  published_at  date,
  updated_at    date
);

create table article_products (           -- one product can appear in many articles
  article_slug  text references articles(slug) on delete cascade,
  product_slug  text references products(slug) on delete cascade,
  placement     text,                       -- e.g. 'table', 'cta', 'inline'
  primary key (article_slug, product_slug)
);

create table keywords (
  id            bigint generated always as identity primary key,
  keyword       text not null unique,
  intent        text,                       -- best | vs | alternatives | review | how-to
  channel       text default 'google',      -- google | pinterest
  volume        int,                        -- fill only from a measured source
  volume_source text,
  article_slug  text references articles(slug)
);

create table campaigns (
  slug          text primary key,           -- used as utm_campaign / ?c=
  name          text,
  channel       text,                       -- pinterest | google | email
  started_at    date
);

create table pins (
  id            bigint generated always as identity primary key,
  article_slug  text references articles(slug),
  title         text not null,
  description   text,
  keyword       text,
  destination_url text not null,            -- article URL with utm_source=pinterest&utm_campaign=<campaign>
  cta           text,
  image_concept text,
  board         text,
  campaign_slug text references campaigns(slug),
  status        text not null default 'idea', -- idea | designed | scheduled | published
  published_at  timestamptz
);

create table clicks (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  product_slug  text not null,
  article_path  text,
  source        text,                       -- pinterest | google | direct | external | <referrer host>
  campaign      text,
  link_type     text,                       -- affiliate | fallback
  country       text
);
create index clicks_created_idx on clicks (created_at);
create index clicks_product_idx on clicks (product_slug);

create table conversions (                -- imported from network dashboards (CSV) – networks report sales, we don't track them
  id            bigint generated always as identity primary key,
  occurred_on   date not null,
  product_slug  text references products(slug),
  network       text,
  amount        numeric(10,2) not null,     -- commission earned
  currency      text not null default 'USD',
  status        text default 'pending',     -- pending | approved | reversed
  sub_id        text,                       -- if the network passes a sub-id back
  external_ref  text unique
);

alter table affiliate_programs enable row level security;
alter table products enable row level security;
alter table articles enable row level security;
alter table article_products enable row level security;
alter table keywords enable row level security;
alter table campaigns enable row level security;
alter table pins enable row level security;
alter table clicks enable row level security;
alter table conversions enable row level security;

-- Reporting views
create view clicks_by_article as
  select article_path, source, count(*) as clicks
  from clicks group by article_path, source;

create view revenue_by_product as
  select p.slug, p.name,
         (select count(*) from clicks c where c.product_slug = p.slug) as clicks,
         coalesce(sum(v.amount) filter (where v.status <> 'reversed'), 0) as revenue
  from products p left join conversions v on v.product_slug = p.slug
  group by p.slug, p.name;
