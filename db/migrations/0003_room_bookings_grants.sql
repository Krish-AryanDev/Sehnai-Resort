-- 0003_room_bookings_grants.sql
-- Defensive GRANTs for room_bookings. Supabase normally sets these by default
-- when you create a table via SQL Editor, but if the table was created via
-- Table Editor or a different connection, the grants may be missing — which
-- produces "permission denied for table room_bookings" even when the JWT is
-- valid.
--
-- Idempotent: re-running this is safe.
--
-- Run in Supabase Studio → SQL editor.

grant all on table public.room_bookings to service_role;
grant select, insert, update, delete on table public.room_bookings
  to anon, authenticated;

-- Sanity check — should return four rows (one per role).
-- select grantee, privilege_type
--   from information_schema.role_table_grants
--   where table_schema = 'public' and table_name = 'room_bookings'
--   order by grantee, privilege_type;
