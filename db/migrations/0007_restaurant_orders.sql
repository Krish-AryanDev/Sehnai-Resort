-- 0007_restaurant_orders.sql
-- Order header. One row per food order placed via /restaurant/order.
-- Line items live in 0008_order_items.sql, joined on order_id.
--
-- Mirrors the room_bookings pattern (0001 + 0004) — payment provider columns
-- are the same shape so the existing /lib/payment-provider.ts abstraction
-- and the demo/Razorpay swap point work for food orders too.
--
-- short_code is a UI-friendly receipt id ("FD-A3K9") shown to the customer
-- on the tracking page and admin kitchen view; the long uuid stays internal
-- (and is what the unguessable tracking URL uses).
--
-- Fulfillment is one of three modes locked in during planning: in_room,
-- takeaway, delivery. Conditional check constraints enforce the mode-
-- specific required fields (room number for in_room, address for delivery)
-- so the kitchen view never has to render an in_room order without a room.
--
-- RLS — anon has NO direct grants on this table. Orders contain PII (phone,
-- address, room number) and there's no safe way to expose a "read your own
-- order" policy when the only identifier the customer holds is the order id
-- (anyone with the link could read; that's fine, but going via a server
-- action gives us a single chokepoint to attach future rate-limiting and
-- audit logging). All public access goes through server actions in
-- /app/[locale]/restaurant/order/_actions/place-order.ts using the service
-- role key. Realtime subscriptions for the customer tracking page (Phase 6)
-- will add a narrow public read policy at that point.
--
-- Run AFTER 0006 in Supabase Studio → SQL editor.

create table if not exists restaurant_orders (
  id                  uuid primary key default gen_random_uuid(),
  short_code          text not null unique,
  fulfillment         text not null
                      check (fulfillment in ('in_room','takeaway','delivery')),
  status              text not null default 'placed'
                      check (status in (
                        'placed','accepted','preparing',
                        'ready','out_for_delivery',
                        'delivered','cancelled'
                      )),

  customer_name       text not null,
  customer_phone      text not null,
  customer_email      text,

  -- in_room only
  room_number         text,

  -- delivery only
  address_line        text,
  address_landmark    text,
  address_pincode     text,
  delivery_lat        double precision,
  delivery_lng        double precision,

  -- takeaway only (optional pickup time; null means ASAP)
  pickup_time         timestamptz,

  -- money (paise — same convention as payment-provider.ts)
  subtotal_paise      int not null check (subtotal_paise >= 0),
  delivery_fee_paise  int not null default 0 check (delivery_fee_paise >= 0),
  tax_paise           int not null default 0 check (tax_paise >= 0),
  total_paise         int not null check (total_paise >= 0),

  -- payment
  payment_mode        text not null check (payment_mode in ('online','cod')),
  payment_status      text not null default 'pending'
                      check (payment_status in ('pending','paid','failed','refunded')),
  provider            text,
  provider_order_id   text,
  provider_payment_id text,

  notes               text,
  cancelled_reason    text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Mode-specific required fields. Enforced in DB so the kitchen view's
  -- read code can rely on them being present.
  constraint chk_in_room_room_number check (
    fulfillment <> 'in_room' or room_number is not null
  ),
  constraint chk_delivery_address check (
    fulfillment <> 'delivery' or address_line is not null
  )
);

-- Kitchen view: list orders by status, newest first.
create index if not exists restaurant_orders_status_created_idx
  on restaurant_orders (status, created_at desc);

-- Payment-provider lookup (confirm/fail/cancel by provider_order_id).
-- Partial because COD orders never have one.
create index if not exists restaurant_orders_provider_order_id_idx
  on restaurant_orders (provider_order_id)
  where provider_order_id is not null;

-- Short-code lookup (used by admin search and customer receipt links).
create index if not exists restaurant_orders_short_code_idx
  on restaurant_orders (short_code);

grant all on table public.restaurant_orders to service_role;
-- intentionally NO grants to anon/authenticated.

alter table restaurant_orders enable row level security;

drop policy if exists "service role manages orders" on restaurant_orders;
create policy "service role manages orders" on restaurant_orders
  for all to service_role using (true) with check (true);
