-- 0005_menu_categories.sql
-- First table for the restaurant ordering system. Holds the section headings
-- on /restaurant/order (Soups, Tandoor, Main Course, etc.) that the storefront
-- groups items under and the sticky category nav scrolls to.
--
-- The id is a human-readable slug ("soups", "tandoor", "main-veg") rather than
-- a UUID — the slug doubles as the in-page anchor link, matches the existing
-- shape in /lib/menu-data.ts, and makes the seed migration (0010) human-
-- readable. Categories are referenced by menu_items via this slug FK.
--
-- RLS: anon can read active categories (the public storefront must load
-- without auth). Writes are service-role only — admin menu editor in /admin
-- runs server actions that use SUPABASE_SERVICE_ROLE_KEY.
--
-- Run AFTER 0001-0004 in Supabase Studio → SQL editor.

create table if not exists menu_categories (
  id          text primary key,                        -- slug, e.g. "tandoor"
  title       text not null,
  subtitle    text,
  sort_order  int not null default 0,
  image_path  text,                                    -- supabase storage path; null = no banner
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Lookup index for the storefront query that lists active categories in
-- their display order.
create index if not exists menu_categories_active_sort_idx
  on menu_categories (is_active, sort_order, id);

-- Defensive GRANTs — same pattern as 0003_room_bookings_grants.sql. Writes
-- never go through anon/authenticated roles; the service role bypasses RLS
-- but keeping the grant explicit makes the security model auditable.
grant all on table public.menu_categories to service_role;
grant select on table public.menu_categories to anon, authenticated;

alter table menu_categories enable row level security;

drop policy if exists "public read active categories" on menu_categories;
create policy "public read active categories" on menu_categories
  for select using (is_active = true);

drop policy if exists "service role manages categories" on menu_categories;
create policy "service role manages categories" on menu_categories
  for all to service_role using (true) with check (true);
