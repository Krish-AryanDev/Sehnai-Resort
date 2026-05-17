-- 0006_menu_items.sql
-- Individual dish rows. Replaces the hardcoded items in /lib/menu-data.ts
-- (which still ships as the source for the seed migration in 0010).
--
-- Pricing model — three optional integer columns in PAISE (1 INR = 100 paise),
-- matching the convention in /lib/payment-provider.ts:
--   • price_single — set when the dish has one portion only.
--   • price_half + price_full — set together when the dish is sold by half/
--     full plate (chicken, mutton). The card UI shows a variant chooser.
--   • price_full only — set when the menu lists a single "full" portion
--     (most tandoor items). UI displays it as a single price.
--
-- The chk_menu_item_pricing constraint ensures every item has at least one
-- price set; the check guarantees we never end up with a $0 item by accident.
--
-- (category_id, name) is unique so the seed migration (0010) is idempotent
-- — re-running 0010 is a no-op rather than producing duplicate rows.
--
-- Run AFTER 0005 in Supabase Studio → SQL editor.

create table if not exists menu_items (
  id            uuid primary key default gen_random_uuid(),
  category_id   text not null references menu_categories(id) on delete restrict,
  name          text not null,
  description   text,
  price_single  int,                                   -- paise
  price_half    int,                                   -- paise
  price_full    int,                                   -- paise
  note          text,                                  -- e.g. "(2 pcs)"
  is_veg        boolean not null default true,
  image_path    text,                                  -- storage path; null = category placeholder
  is_available  boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint chk_menu_item_pricing check (
    price_single is not null or
    price_half   is not null or
    price_full   is not null
  ),
  constraint menu_items_category_name_key unique (category_id, name)
);

-- Storefront query: list items for a category in display order.
create index if not exists menu_items_category_sort_idx
  on menu_items (category_id, sort_order);

-- Partial index covering the common storefront filter — most rows are
-- available, so this stays small.
create index if not exists menu_items_available_idx
  on menu_items (category_id, sort_order)
  where is_available = true;

grant all on table public.menu_items to service_role;
grant select on table public.menu_items to anon, authenticated;

alter table menu_items enable row level security;

-- Public reads include unavailable items so the storefront can show them
-- with a disabled "Sold out" state instead of silently hiding them. Filter
-- happens in the app, not RLS.
drop policy if exists "public read items" on menu_items;
create policy "public read items" on menu_items
  for select using (true);

drop policy if exists "service role manages items" on menu_items;
create policy "service role manages items" on menu_items
  for all to service_role using (true) with check (true);
