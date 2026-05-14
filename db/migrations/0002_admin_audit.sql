-- 0002_admin_audit.sql
-- Adds an audit column to room_bookings so admin-created blocks record who
-- made them. Plus a service-role write policy (RLS) for admin-issued writes.
--
-- Run AFTER 0001_room_bookings.sql, in Supabase Studio → SQL editor.

alter table room_bookings
  add column if not exists created_by_email text;

-- Service-role key bypasses RLS by design, so these policies aren't strictly
-- required — but enabling explicit insert/update/delete policies for the
-- service role makes the intent visible to anyone auditing the schema.
drop policy if exists "service role can insert" on room_bookings;
create policy "service role can insert" on room_bookings
  for insert to service_role with check (true);

drop policy if exists "service role can update" on room_bookings;
create policy "service role can update" on room_bookings
  for update to service_role using (true) with check (true);
