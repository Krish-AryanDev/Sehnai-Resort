import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { findAvailableRoomForVariant, type RoomBooking } from "@/lib/rooms-data";

/**
 * Server-side write helpers for the booking flow. Service-role only —
 * these routinely insert/update rows that the anon RLS policy doesn't
 * permit, so callers must already be running inside server actions or
 * route handlers that themselves gate on the right context (admin auth
 * for admin paths, or the payment-server-action flow for public paths).
 */

export type CreatePendingArgs = {
  categoryId: string;
  variantId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  provider: "demo" | "razorpay";
  providerOrderId: string;
};

export type CreatePendingResult =
  | {
      ok: true;
      bookingId: string;
      assignedRoomId: string;
    }
  | { ok: false; reason: string };

/**
 * Pick an available room for the variant, then insert a pending booking
 * holding it. Overlap-checked against existing pending/confirmed rows
 * (same half-open math as the public availability helper).
 *
 * Race note: there's no transactional lock here, so two simultaneous
 * requests for the last room could both succeed. Acceptable for the demo
 * — when Razorpay lands we'll wrap this in `SELECT ... FOR UPDATE` per
 * roadmap §3. For now, manual cleanup via the admin panel if it ever
 * actually happens.
 */
export async function createPendingBooking(
  args: CreatePendingArgs
): Promise<CreatePendingResult> {
  const supabase = getSupabaseAdminClient();

  // Pull the current booking set for this variant's rooms so we can pick a
  // free one. Mirrors what the public site does at render time.
  const { data: existing, error: readErr } = await supabase
    .from("room_bookings")
    .select("id, room_id, check_in, check_out")
    .in("status", ["pending", "confirmed"]);

  if (readErr) return { ok: false, reason: readErr.message };

  const bookings: RoomBooking[] = (existing ?? []).map((b) => ({
    id: b.id,
    roomId: b.room_id,
    checkIn: b.check_in,
    checkOut: b.check_out,
  }));

  const room = findAvailableRoomForVariant(
    args.variantId,
    args.checkIn,
    args.checkOut,
    bookings
  );

  if (!room) {
    return { ok: false, reason: "No rooms available for those dates." };
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("room_bookings")
    .insert({
      room_id: room.id,
      check_in: args.checkIn,
      check_out: args.checkOut,
      guest_name: args.guestName,
      guest_phone: args.guestPhone,
      guest_email: args.guestEmail,
      source: "online",
      status: "pending",
      provider: args.provider,
      provider_order_id: args.providerOrderId,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return { ok: false, reason: insertErr?.message ?? "Insert failed." };
  }

  return { ok: true, bookingId: inserted.id, assignedRoomId: room.id };
}

/** Flip pending → confirmed and stamp the payment id. */
export async function confirmPendingBooking(
  providerOrderId: string,
  providerPaymentId: string
): Promise<{ ok: true; bookingId: string } | { ok: false; reason: string }> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("room_bookings")
    .update({
      status: "confirmed",
      provider_payment_id: providerPaymentId,
    })
    .eq("provider_order_id", providerOrderId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, reason: error.message };
  if (!data) {
    return {
      ok: false,
      reason: "Order not found or no longer pending.",
    };
  }
  return { ok: true, bookingId: data.id };
}

/** Flip pending → failed. Used when the provider rejects the payment. */
export async function failPendingBooking(
  providerOrderId: string,
  failureReason: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("room_bookings")
    .update({
      status: "failed",
      guest_name: failureReason.slice(0, 200) || null,
    })
    .eq("provider_order_id", providerOrderId)
    .eq("status", "pending");

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

/** Flip pending → cancelled. Used when the user closes the checkout UI
 *  without paying. Frees the room immediately on the public site. */
export async function cancelPendingBooking(
  providerOrderId: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("room_bookings")
    .update({ status: "cancelled" })
    .eq("provider_order_id", providerOrderId)
    .eq("status", "pending");

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}
