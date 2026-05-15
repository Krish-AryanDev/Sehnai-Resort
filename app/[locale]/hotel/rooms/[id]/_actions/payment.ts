"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import {
  getCategoryById,
  countAvailableInVariant,
  roomCategories,
  individualRooms,
  type RoomBooking,
} from "@/lib/rooms-data";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  createPendingBooking,
  confirmPendingBooking,
  failPendingBooking,
  cancelPendingBooking,
} from "@/lib/booking-mutations";
import {
  activePaymentProvider,
  type PaymentOrder,
} from "@/lib/payment-provider";
import {
  notifyAdmin,
  formatBookingConfirmationMessage,
} from "@/lib/whatsapp-notifier";

/**
 * Public-facing payment server actions. These are the single seam where a
 * demo provider and a future Razorpay provider plug in.
 *
 * Demo provider (today):
 *   - createPaymentOrder generates a UUID-based order id and inserts a
 *     pending booking referencing it.
 *   - confirmPayment trusts the client's signal because nothing real is
 *     happening — the "payment" was a button click in <DemoPaymentModal />.
 *
 * Razorpay provider (later):
 *   - createPaymentOrder will additionally POST to Razorpay's `/orders` API
 *     and store the returned `order_<id>` as provider_order_id.
 *   - confirmPayment will validate the `razorpay_signature` from the
 *     checkout callback against the secret key. Without that signature
 *     check, the row stays pending — a client cannot just flip its own
 *     booking to confirmed.
 *
 * The server-action signatures and DB column layout are identical between
 * the two providers; only the bodies of these three functions change.
 */

type CreateOrderInput = {
  categoryId: string;
  variantId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  /** Optional today (demo flow doesn't collect contact info). Razorpay
   *  callbacks will pass these on the confirmPayment side instead, but
   *  the field is allowed at create-time too so future flows that prefill
   *  Razorpay can use it. */
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
};

export type CreateOrderResult =
  | { ok: true; order: PaymentOrder }
  | { ok: false; reason: string };

export async function createPaymentOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const category = getCategoryById(input.categoryId);
  if (!category) return { ok: false, reason: "Unknown room category." };

  const variant = category.variants.find((v) => v.id === input.variantId);
  if (!variant) return { ok: false, reason: "Unknown room variant." };

  if (!input.checkIn || !input.checkOut || input.checkOut <= input.checkIn) {
    return { ok: false, reason: "Invalid date range." };
  }
  if (input.guests < 1 || input.guests > variant.maxGuests) {
    return { ok: false, reason: "Guest count out of range." };
  }

  // Fresh availability snapshot — the public page caches for 30s, so this
  // re-check is the authoritative gate.
  const supabase = await getSupabaseServerClient();
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

  if (
    countAvailableInVariant(
      variant.id,
      input.checkIn,
      input.checkOut,
      bookings
    ) === 0
  ) {
    return { ok: false, reason: "Sold out for those dates." };
  }

  const provider = activePaymentProvider();
  const providerOrderId =
    provider === "demo"
      ? `demo_order_${randomUUID().replace(/-/g, "").slice(0, 16)}`
      : // Razorpay provider would call its `/orders` API here and use the
        // returned id. Throw for now so we don't silently mismatch.
        (() => {
          throw new Error(
            "Razorpay provider is not implemented yet. Set PAYMENT_PROVIDER=demo or implement the Razorpay path."
          );
        })();

  const nights = Math.max(
    1,
    Math.round(
      (new Date(input.checkOut).getTime() -
        new Date(input.checkIn).getTime()) /
        86_400_000
    )
  );

  const totalRupees = variant.pricePerNight * nights;
  const totalPaise = totalRupees * 100;

  const created = await createPendingBooking({
    categoryId: input.categoryId,
    variantId: input.variantId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    guestName: input.guestName?.trim() || null,
    guestPhone: input.guestPhone?.trim() || null,
    guestEmail: input.guestEmail?.trim() || null,
    provider,
    providerOrderId,
  });
  if (!created.ok) return { ok: false, reason: created.reason };

  const order: PaymentOrder = {
    orderId: providerOrderId,
    bookingId: created.bookingId,
    amount: totalPaise,
    currency: "INR",
    receipt: `SR-${created.bookingId.slice(0, 8).toUpperCase()}`,
    provider,
    booking: {
      categoryId: input.categoryId,
      variantId: input.variantId,
      variantName: variant.name,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights,
      guests: input.guests,
    },
  };

  // Public detail page will reflect the new pending hold at next ISR window;
  // bust the cache now so the room is visible as sold-out immediately.
  revalidatePath("/[locale]/hotel/rooms/[id]", "page");

  return { ok: true, order };
}

export type ConfirmPaymentResult =
  | { ok: true; bookingId: string }
  | { ok: false; reason: string };

export async function confirmPayment(
  providerOrderId: string,
  paymentResponse: {
    /** For demo: just a flag. For Razorpay: the `razorpay_payment_id` +
     *  `razorpay_signature` would arrive here and get verified against
     *  the secret key before this call accepts the payment. */
    simulated?: boolean;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }
): Promise<ConfirmPaymentResult> {
  const provider = activePaymentProvider();

  let paymentId: string;
  if (provider === "demo") {
    if (!paymentResponse.simulated) {
      return {
        ok: false,
        reason: "Demo provider expects { simulated: true }.",
      };
    }
    paymentId = `demo_pay_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  } else {
    // Razorpay path. Verify the signature here BEFORE accepting the payment.
    // Throw for now so a half-built Razorpay setup can't silently confirm.
    throw new Error(
      "Razorpay confirmPayment path is not implemented yet. Verify the " +
        "razorpay_signature against RAZORPAY_KEY_SECRET before marking confirmed."
    );
  }

  const result = await confirmPendingBooking(providerOrderId, paymentId);
  if (!result.ok) return { ok: false, reason: result.reason };

  // Fire the admin WhatsApp notification. Fully isolated try/catch: a notify
  // failure must never roll back the booking confirmation that just succeeded.
  await sendBookingNotification(result.bookingId);

  revalidatePath("/[locale]/hotel/rooms/[id]", "page");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");

  return { ok: true, bookingId: result.bookingId };
}

/**
 * Re-fetch the just-confirmed booking and send a WhatsApp message to the
 * admin. Re-fetching (rather than threading data through from the caller)
 * means the notification reflects the authoritative DB state — including
 * the room the system actually picked.
 *
 * All errors are swallowed and logged. The booking has already committed
 * by the time this runs; we don't want a flaky WhatsApp endpoint to make
 * the user think their payment failed.
 */
async function sendBookingNotification(bookingId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data: booking, error } = await supabase
      .from("room_bookings")
      .select(
        "id, room_id, check_in, check_out, guest_name, guest_phone, guest_email, provider"
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (error || !booking) {
      // eslint-disable-next-line no-console
      console.warn(
        "[whatsapp] could not fetch booking for notification:",
        error?.message ?? "row not found"
      );
      return;
    }

    const room = individualRooms.find((r) => r.id === booking.room_id);
    const variant = room
      ? roomCategories
          .flatMap((c) =>
            c.variants.map((v) => ({ ...v, categoryName: c.name }))
          )
          .find((v) => v.id === room.variantId) ?? null
      : null;

    const nights = nightsBetweenIso(booking.check_in, booking.check_out);
    const total = variant ? variant.pricePerNight * nights : 0;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "";
    const adminUrl = baseUrl ? `${baseUrl}/admin/bookings/${booking.id}` : null;

    const message = formatBookingConfirmationMessage({
      bookingId: booking.id,
      roomNumber: room?.roomNumber ?? booking.room_id,
      variantName: variant?.name ?? "Room",
      categoryName: variant?.categoryName ?? "",
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      nights,
      total,
      guestName: booking.guest_name,
      guestPhone: booking.guest_phone,
      guestEmail: booking.guest_email,
      provider: booking.provider,
      adminUrl,
    });

    const result = await notifyAdmin(message);
    if (!result.ok) {
      // eslint-disable-next-line no-console
      console.warn("[whatsapp] notify failed:", result.error);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      "[whatsapp] notification threw:",
      err instanceof Error ? err.message : String(err)
    );
  }
}

function nightsBetweenIso(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000));
}

/** Mark a pending order as failed. Called from the demo modal's "Simulate
 *  failure" button; for Razorpay this would be called from the
 *  `payment.failed` handler in the checkout SDK callback. */
export async function failPayment(
  providerOrderId: string,
  reason: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const result = await failPendingBooking(providerOrderId, reason);
  if (result.ok) {
    revalidatePath("/[locale]/hotel/rooms/[id]", "page");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/calendar");
  }
  return result;
}

/** User dismissed the checkout UI without paying. Frees the room. */
export async function cancelPayment(
  providerOrderId: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const result = await cancelPendingBooking(providerOrderId);
  if (result.ok) {
    revalidatePath("/[locale]/hotel/rooms/[id]", "page");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/calendar");
  }
  return result;
}
