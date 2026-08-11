-- ============================================================================
-- Travelly database schema
-- ============================================================================
-- How to run this:
--   1. Open your Supabase project -> SQL Editor -> New query
--   2. Paste this ENTIRE file
--   3. Click "Run"
-- Safe to re-run — it won't create duplicates or wipe existing data.
-- ============================================================================

create extension if not exists pgcrypto;

-- Destinations: the admin-verified source of truth. The `verified` column
-- holds hotels, restaurants, attractions, fees, contacts, warnings, etc. as
-- one JSON blob — matching the Destination['verified'] shape in lib/types.ts.
create table if not exists destinations (
  id text primary key,
  name text not null,
  state text not null,
  tagline text,
  best_season text,
  accent_emoji text,
  overview text,
  verified jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Orders: one row per paid trip request. `itinerary` is filled in once the
-- AI has generated it. `status` tracks the order lifecycle end to end.
-- `user_id` links to Supabase's built-in auth.users table (real login via
-- email/password or Google) — this is what makes "My Trips" secure.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  destination_id text references destinations(id),
  trip_request jsonb not null,
  customer_name text not null,
  customer_phone text not null,
  plan text not null check (plan in ('explorer','plus')),
  status text not null default 'payment_successful'
    check (status in ('awaiting_payment','payment_successful','ai_processing','ready','delivered')),
  payment_id text,
  itinerary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe to re-run on a database created from an earlier version of this file.
alter table orders add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists orders_user_idx on orders (user_id);

create index if not exists orders_phone_idx on orders (customer_phone);
create index if not exists orders_created_idx on orders (created_at desc);

-- Keep updated_at current automatically.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists destinations_set_updated_at on destinations;
create trigger destinations_set_updated_at
  before update on destinations
  for each row execute function set_updated_at();

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- This app only ever talks to Supabase from the server using the service_role
-- key (never from the browser), so Row Level Security can stay simple: locked
-- down entirely. The service_role key bypasses RLS by design.
alter table destinations enable row level security;
alter table orders enable row level security;

-- ============================================================================
-- Seed data: the same 2 sample destinations from Phase 1 — still placeholder
-- data (see isSampleData in each row). Replace via the admin panel before
-- sharing with real users.
-- ============================================================================

insert into destinations (id, name, state, tagline, best_season, accent_emoji, overview, verified)
values (
  'jaipur',
  'Jaipur',
  'Rajasthan',
  'The Pink City — forts, bazaars, and Rajasthani royalty',
  'October to March',
  '🏰',
  'Jaipur pairs hilltop forts and a walled old city painted in terracotta pink with some of India''s best palace architecture, block-print textiles, and street food. It''s compact enough to cover well in 3-4 days.',
  '{"isSampleData":true,"lastVerifiedOn":"REPLACE — e.g. 2026-08-01","hotels":[{"name":"[Add real budget hotel name]","category":"budget","pricePerNight":"₹1,200 – ₹2,000 (placeholder)","contact":"+91-90000-00001 (placeholder)","mapsQuery":"Budget hotel near Hawa Mahal Jaipur"},{"name":"[Add real mid-range hotel name]","category":"mid-range","pricePerNight":"₹3,500 – ₹5,500 (placeholder)","contact":"+91-90000-00002 (placeholder)","mapsQuery":"Mid-range hotel Jaipur city center"},{"name":"[Add real luxury hotel/heritage property]","category":"luxury","pricePerNight":"₹12,000+ (placeholder)","contact":"+91-90000-00003 (placeholder)","mapsQuery":"Heritage luxury hotel Jaipur"}],"restaurants":[{"name":"[Add real local restaurant — Rajasthani thali]","cuisine":"Rajasthani thali","priceRange":"₹300 – ₹500 for two (placeholder)","mapsQuery":"Rajasthani thali restaurant Jaipur"},{"name":"[Add real street food spot]","cuisine":"Street food","priceRange":"₹100 – ₹200 for two (placeholder)","mapsQuery":"Famous street food Jaipur"}],"attractions":[{"name":"Amber Fort","entryFee":"₹REPLACE (Indian) / ₹REPLACE (Foreign) — verify current fee","openingHours":"8:00 AM – 5:30 PM (verify)","mapsQuery":"Amber Fort Jaipur","photographyAllowed":true,"notes":"Verify elephant/jeep ride pricing separately if offering it."},{"name":"Hawa Mahal","entryFee":"₹REPLACE — verify current fee","openingHours":"9:00 AM – 4:30 PM (verify)","mapsQuery":"Hawa Mahal Jaipur","photographyAllowed":true},{"name":"City Palace","entryFee":"₹REPLACE — verify current fee","openingHours":"9:30 AM – 5:00 PM (verify)","mapsQuery":"City Palace Jaipur","photographyAllowed":true}],"emergencyContacts":[{"label":"Tourist Police Helpline","number":"REPLACE with real number"},{"label":"Local Police Station","number":"REPLACE with real number"},{"label":"Nearest Hospital","number":"REPLACE with real number"}],"localFood":["Dal Baati Churma","Pyaaz Kachori","Ghewar","Laal Maas"],"shopping":[{"name":"Johari Bazaar","specialty":"Jewellery"},{"name":"Bapu Bazaar","specialty":"Textiles & juttis"}],"smartWarnings":[{"type":"Cash Recommended","message":"Carry cash for smaller shops and street food stalls — verify current card acceptance."},{"type":"Heat Wave","message":"Summers (Apr–Jun) get extremely hot — verify seasonal advisory before recommending this period."}],"transportTips":"Auto-rickshaws and app cabs are widely available. Verify current typical fare ranges before publishing."}'::jsonb
)
on conflict (id) do update set
  name = excluded.name, state = excluded.state, tagline = excluded.tagline,
  best_season = excluded.best_season, accent_emoji = excluded.accent_emoji,
  overview = excluded.overview, verified = excluded.verified, updated_at = now();

insert into destinations (id, name, state, tagline, best_season, accent_emoji, overview, verified)
values (
  'munnar',
  'Munnar',
  'Kerala',
  'Tea-carpeted hills and misty Western Ghats mornings',
  'September to May',
  '🌄',
  'Munnar''s rolling tea estates, cool climate, and slow pace make it a favourite hill-station escape — good for both relaxed sightseeing and short treks, with easy indoor alternatives on rainy days.',
  '{"isSampleData":true,"lastVerifiedOn":"REPLACE — e.g. 2026-08-01","hotels":[{"name":"[Add real budget homestay/hotel]","category":"budget","pricePerNight":"₹1,500 – ₹2,500 (placeholder)","contact":"+91-90000-00004 (placeholder)","mapsQuery":"Budget homestay Munnar"},{"name":"[Add real mid-range resort]","category":"mid-range","pricePerNight":"₹4,000 – ₹6,500 (placeholder)","contact":"+91-90000-00005 (placeholder)","mapsQuery":"Mid-range resort Munnar"},{"name":"[Add real luxury plantation stay]","category":"luxury","pricePerNight":"₹15,000+ (placeholder)","contact":"+91-90000-00006 (placeholder)","mapsQuery":"Luxury plantation stay Munnar"}],"restaurants":[{"name":"[Add real Kerala-cuisine restaurant]","cuisine":"Kerala meals","priceRange":"₹250 – ₹450 for two (placeholder)","mapsQuery":"Kerala meals restaurant Munnar"}],"attractions":[{"name":"Eravikulam National Park","entryFee":"₹REPLACE — verify current fee, note permit/timing rules","openingHours":"7:00 AM – 4:00 PM (verify, seasonal closures possible)","mapsQuery":"Eravikulam National Park Munnar","photographyAllowed":true,"notes":"Verify Nilgiri Tahr viewing rules and vehicle-shuttle costs."},{"name":"Tea Museum","entryFee":"₹REPLACE — verify current fee","openingHours":"9:00 AM – 4:30 PM (verify)","mapsQuery":"Tea Museum Munnar","photographyAllowed":false,"notes":"Verify current photography policy inside the museum."}],"emergencyContacts":[{"label":"Tourist Police Helpline","number":"REPLACE with real number"},{"label":"Local Police Station","number":"REPLACE with real number"},{"label":"Nearest Hospital","number":"REPLACE with real number"}],"localFood":["Kerala Sadya","Appam with Stew","Karimeen Pollichathu"],"shopping":[{"name":"Local tea estate shops","specialty":"Tea & spices"}],"smartWarnings":[{"type":"Heavy Rain","message":"Monsoon (Jun–Aug) brings heavy rain and landslide risk on hill roads — verify current advisories."},{"type":"Mobile Network Issues","message":"Signal can be patchy in estate areas — verify which networks work best currently."}],"permits":"Some park areas may require entry permits — verify current rules.","transportTips":"Roads are winding hill roads; self-drive is doable but verify current road conditions in monsoon."}'::jsonb
)
on conflict (id) do update set
  name = excluded.name, state = excluded.state, tagline = excluded.tagline,
  best_season = excluded.best_season, accent_emoji = excluded.accent_emoji,
  overview = excluded.overview, verified = excluded.verified, updated_at = now();

