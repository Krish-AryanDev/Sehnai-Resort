-- 0001_room_bookings.sql
-- Run once in Supabase Studio → SQL editor.
--
-- Single dynamic table for now: blocks/holds on individual rooms.
-- Static catalog (room_categories, room_variants, individual_rooms) stays
-- in code (lib/rooms-data.ts) until the admin panel (roadmap §4) ships.

create table if not exists room_bookings (
  id          uuid primary key default gen_random_uuid(),
  room_id     text not null,
  check_in    date not null,
  check_out   date not null,
  guest_name  text,
  guest_phone text,
  guest_email text,
  source      text not null default 'admin'
              check (source in ('admin','online')),
  status      text not null default 'confirmed'
              check (status in ('pending','confirmed','failed','cancelled')),
  created_at  timestamptz not null default now(),
  constraint chk_dates check (check_out > check_in)
);

-- Lookup index for the date-overlap query that powers
-- countAvailableInVariant / findAvailableRoomForVariant.
create index if not exists room_bookings_lookup_idx
  on room_bookings (room_id, check_in, check_out);

-- Defensive GRANTs. Supabase usually sets these automatically when a table
-- is made via the SQL editor, but Table-Editor-created tables sometimes
-- skip the service_role grant, which surfaces later as "permission denied
-- for table room_bookings" from the admin panel. Idempotent.
grant all on table room_bookings to service_role;
grant select, insert, update, delete on table room_bookings
  to anon, authenticated;

-- RLS: anyone can read non-cancelled rows (the public detail page needs to
-- compute availability without auth). Writes are denied by default; admin
-- and payment flows will run with the service role key from the server.
alter table room_bookings enable row level security;

drop policy if exists "public read non-cancelled" on room_bookings;
create policy "public read non-cancelled" on room_bookings
  for select
  using (status in ('pending','confirmed'));
