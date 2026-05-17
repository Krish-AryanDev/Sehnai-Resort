-- 0009_restaurant_settings.sql
-- Single-row table holding the restaurant ordering system's runtime config.
-- Edited from /admin/restaurant-settings; read by checkout (delivery radius
-- + fee), the order summary (GST), and the storefront banner (kitchen open
-- hours).
--
-- The id = 1 check constraint enforces the singleton — there is exactly one
-- settings row, and `select * from restaurant_settings where id = 1` is the
-- authoritative read. Trying to insert a second row fails the check.
--
-- The migration seeds the row with sensible defaults (5 km radius, free
-- delivery, no minimum order, 5% GST) so the app boots correctly the first
-- time it's loaded — the admin can refine values from /admin/restaurant-
-- settings later.
--
-- RLS — anon can read (storefront/checkout need it without auth); writes
-- are service-role only.
--
-- Run AFTER 0008 in Supabase Studio → SQL editor.

create table if not exists restaurant_settings (
  id                  int primary key default 1 check (id = 1),
  delivery_enabled    boolean       not null default true,
  delivery_radius_km  numeric(6,2)  not null default 5.00,
  delivery_fee_paise  int           not null default 0  check (delivery_fee_paise >= 0),
  min_order_paise     int           not null default 0  check (min_order_paise >= 0),
  restaurant_lat      double precision,
  restaurant_lng      double precision,
  kitchen_open_from   text,                            -- "09:00" 24h local
  kitchen_open_to     text,                            -- "23:00" 24h local
  gst_percent         numeric(5,2)  not null default 5.00 check (gst_percent >= 0),
  updated_at          timestamptz   not null default now()
);

insert into restaurant_settings (id) values (1)
on conflict (id) do nothing;

grant all on table public.restaurant_settings to service_role;
grant select on table public.restaurant_settings to anon, authenticated;

alter table restaurant_settings enable row level security;

drop policy if exists "public read settings" on restaurant_settings;
create policy "public read settings" on restaurant_settings
  for select using (true);

drop policy if exists "service role manages settings" on restaurant_settings;
create policy "service role manages settings" on restaurant_settings
  for all to service_role using (true) with check (true);
