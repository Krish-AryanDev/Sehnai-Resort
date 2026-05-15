-- 0004_payment_columns.sql
-- Adds payment-provider columns to room_bookings. Designed to fit both the
-- current demo provider AND the Razorpay flow that will replace it without
-- a schema change.
--
-- Columns:
--   provider             — "demo" | "razorpay" | future providers
--   provider_order_id    — the order id created by the provider (demo uses
--                          our own UUID; Razorpay uses its `order_<id>`)
--   provider_payment_id  — populated only after a successful payment
--                          (Razorpay's `pay_<id>`; demo uses our UUID)
--
-- All three are nullable to preserve existing admin-source rows (which
-- have no associated payment).
--
-- Run AFTER 0001/0002/0003 in Supabase Studio → SQL editor.

alter table room_bookings
  add column if not exists provider            text,
  add column if not exists provider_order_id   text,
  add column if not exists provider_payment_id text;

-- Lookup index for confirmPayment / failPayment / cancelPendingPayment.
-- Partial because most rows (admin blocks) won't have an order id.
create index if not exists room_bookings_provider_order_id_idx
  on room_bookings (provider_order_id)
  where provider_order_id is not null;
