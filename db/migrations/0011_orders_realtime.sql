-- 0011_orders_realtime.sql
-- Phase 6 prerequisites: expose restaurant_orders to anon for
--   (a) the customer tracking page's Supabase Realtime subscription, and
--   (b) the admin kitchen view's realtime channel (admins are logged-in
--       so they hit RLS as 'authenticated' — covered by the same policy
--       below since `to public` includes both anon and authenticated).
--
-- 0007 intentionally withheld these grants. The tradeoff was documented
-- there: orders contain PII (phone, address, room number) and going
-- through a server action gave a chokepoint for future rate-limiting.
-- For Phase 6 we accept the tradeoff: the order's UUID is the gate
-- (unguessable v4 — exactly the same security model the customer's
-- tracking URL already relies on). Re-tightening with a Postgres RPC or
-- a narrower view is a Phase 7 concern.
--
-- IMPORTANT: order_items is NOT exposed here. Status changes happen on
-- the order header only, so realtime only needs the header. The line
-- items are still read server-side via the service-role client.
--
-- Run AFTER 0010 in Supabase Studio → SQL editor.

grant select on table public.restaurant_orders to anon, authenticated;

drop policy if exists "public read by id (Phase 6)" on restaurant_orders;
create policy "public read by id (Phase 6)" on restaurant_orders
  for select
  to public
  using (true);

-- Add restaurant_orders to the Supabase Realtime publication so the
-- channel subscriptions in TrackingClient and OrdersList receive change
-- events. Wrapped in a DO block so the migration is idempotent — if the
-- table is already part of the publication the ALTER would error.
do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'restaurant_orders'
  ) then
    alter publication supabase_realtime add table public.restaurant_orders;
  end if;
end
$$;

-- Sanity check — should return one row showing restaurant_orders in the
-- supabase_realtime publication:
--   select schemaname, tablename
--     from pg_publication_tables
--     where pubname = 'supabase_realtime' and tablename = 'restaurant_orders';
