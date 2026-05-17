-- 0008_order_items.sql
-- Line items for restaurant_orders. One row per (order, dish, variant).
--
-- Snapshot policy — name_snapshot and unit_price_paise are COPIED from
-- menu_items at order time, not joined. Two reasons:
--   1. Historical orders survive menu edits (price changes, item deletions,
--      typo fixes) and the receipt always reads what the customer agreed to.
--   2. menu_item_id is FK with ON DELETE SET NULL — admin can safely delete
--      a discontinued dish without nuking past order history.
--
-- variant — 'single' / 'half' / 'full'. Matches the three price columns on
-- menu_items so the cart can record exactly which portion was ordered.
--
-- RLS — service-role only, same reasoning as restaurant_orders. Reads happen
-- via server actions that join header + items in one query.
--
-- Run AFTER 0007 in Supabase Studio → SQL editor.

create table if not exists order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references restaurant_orders(id) on delete cascade,
  menu_item_id      uuid references menu_items(id) on delete set null,
  name_snapshot     text not null,
  variant           text not null check (variant in ('single','half','full')),
  unit_price_paise  int  not null check (unit_price_paise >= 0),
  qty               int  not null check (qty > 0),
  line_total_paise  int  not null check (line_total_paise >= 0),
  created_at        timestamptz not null default now()
);

-- Hot path: fetch all items for an order. Always queried by order_id.
create index if not exists order_items_order_idx on order_items (order_id);

grant all on table public.order_items to service_role;

alter table order_items enable row level security;

drop policy if exists "service role manages order items" on order_items;
create policy "service role manages order items" on order_items
  for all to service_role using (true) with check (true);
