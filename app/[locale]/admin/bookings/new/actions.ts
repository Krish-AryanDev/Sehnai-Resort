"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { individualRooms } from "@/lib/rooms-data";

/**
 * Insert a `source = admin, status = confirmed` row into room_bookings. The
 * public site picks it up at the next ISR window (≤30s) or sooner thanks to
 * revalidatePath below.
 *
 * On validation error we redirect back to the form with `?error=...`. On
 * success we redirect to the bookings list so the admin sees the new row.
 */
export async function createBlockBooking(formData: FormData): Promise<never> {
  const user = await requireAdmin();

  const roomId = (formData.get("roomId") ?? "").toString();
  const checkIn = (formData.get("checkIn") ?? "").toString();
  const checkOut = (formData.get("checkOut") ?? "").toString();
  const guestName = (formData.get("guestName") ?? "").toString().trim() || null;
  const guestPhone = (formData.get("guestPhone") ?? "").toString().trim() || null;
  const guestEmail = (formData.get("guestEmail") ?? "").toString().trim() || null;

  const fail = (msg: string): never => {
    const params = new URLSearchParams({ error: msg, roomId });
    redirect(`/admin/bookings/new?${params.toString()}`);
  };

  if (!roomId) fail("Pick a room.");
  if (!individualRooms.some((r) => r.id === roomId)) fail("Unknown room.");
  if (!checkIn || !checkOut) fail("Both check-in and check-out are required.");
  if (checkOut <= checkIn) fail("Check-out must be after check-in.");

  const supabase = getSupabaseAdminClient();

  // Overlap guard. The DB has no exclusion constraint (yet), so we read
  // existing rows for this room and reject overlaps in the same half-open
  // interval that the public availability math uses.
  const { data: existing, error: readErr } = await supabase
    .from("room_bookings")
    .select("id, check_in, check_out")
    .eq("room_id", roomId)
    .in("status", ["pending", "confirmed"]);

  if (readErr) fail(`Couldn't check for overlaps: ${readErr.message}`);

  const clash = (existing ?? []).some(
    (b) => checkIn < b.check_out && checkOut > b.check_in
  );
  if (clash) {
    fail("Those dates overlap an existing booking for that room.");
  }

  const { error } = await supabase.from("room_bookings").insert({
    room_id: roomId,
    check_in: checkIn,
    check_out: checkOut,
    guest_name: guestName,
    guest_phone: guestPhone,
    guest_email: guestEmail,
    source: "admin",
    status: "confirmed",
    created_by_email: user.email ?? null,
  });

  if (error) fail(`Insert failed: ${error.message}`);

  // Public detail pages cache for 30s — bust them now so the new block is
  // visible immediately. Path uses route patterns to cover every locale × id.
  revalidatePath("/[locale]/hotel/rooms/[id]", "page");
  revalidatePath("/admin/bookings");

  redirect("/admin/bookings");
}
