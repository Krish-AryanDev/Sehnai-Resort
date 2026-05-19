"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import {
  createOrder,
  confirmOrderPayment,
  failOrderPayment,
  cancelOrderPayment,
  type CartLineInput,
  type Fulfillment,
} from "@/lib/order-mutations";
import { getRestaurantSettings } from "@/lib/menu-repo";
import { getOrderWithLines } from "@/lib/order-repo";
import { checkDeliveryRadius } from "@/lib/delivery-distance";
import {
  activePaymentProvider,
  type FoodPaymentOrder,
} from "@/lib/payment-provider";
import { computeServerSideTax } from "./_lib-internal";
import { sendAdminOrderNotification } from "@/lib/order-notify";

/**
 * Online-payment server actions for the food-ordering flow. Mirrors the
 * shape of the room-booking payment actions
 * ([app/[locale]/hotel/rooms/[id]/_actions/payment.ts](../../../../hotel/rooms/[id]/_actions/payment.ts))
 * so swapping the demo provider for Razorpay is a single-component change:
 * replace `<DemoPaymentModal />` with `<RazorpayCheckout />` and the bodies
 * of `createOnlinePaymentOrder` / `confirmOnlinePayment` flip to talk to
 * Razorpay's `/orders` and signature verification — the action signatures
 * stay identical.
 *
 * Lifecycle:
 *   1. createOnlinePaymentOrder — runs the same pre-flight as the COD path,
 *      mints a `provider_order_id`, inserts the order with payment_mode='online'
 *      and payment_status='pending'. Returns a FoodPaymentOrder ready for
 *      the modal.
 *   2. confirmOnlinePayment      — modal's "Pay" button. Flips payment_status
 *      to 'paid', stamps provider_payment_id, fires WhatsApp.
 *   3. failOnlinePayment         — modal's "Simulate failure" button (or
 *      Razorpay's payment.failed handler). Cancels the order.
 *   4. cancelOnlinePayment       — user dismissed the modal without paying.
 *      Treated the same as failure — the order is cancelled, no payment ever
 *      arrives. The cart-side cleanup (cart.clear, navigation) is the
 *      caller's job.
 */

export type CreateOnlinePaymentOrderInput = {
  fulfillment: Fulfillment;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;

  roomNumber?: string | null;

  addressLine?: string | null;
  addressLandmark?: string | null;
  addressPincode?: string | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;

  pickupTime?: string | null;
  notes?: string | null;

  cart: CartLineInput[];
};

export type CreateOnlinePaymentOrderResult =
  | { ok: true; order: FoodPaymentOrder }
  | { ok: false; reason: string };

export async function createOnlinePaymentOrder(
  input: CreateOnlinePaymentOrderInput
): Promise<CreateOnlinePaymentOrderResult> {
  // ---- Surface-level guards (mirror of placeCodOrder) ----
  if (input.cart.length === 0) {
    return { ok: false, reason: "Your cart is empty." };
  }
  const phoneDigits = input.customerPhone.replace(/[^\d]/g, "");
  if (phoneDigits.length < 10) {
    return {
      ok: false,
      reason: "Enter a valid phone number (at least 10 digits).",
    };
  }
  if (!input.customerName.trim()) {
    return { ok: false, reason: "Name is required." };
  }
  if (input.fulfillment === "in_room" && !input.roomNumber?.trim()) {
    return { ok: false, reason: "Room number is required for in-room orders." };
  }
  if (input.fulfillment === "delivery" && !input.addressLine?.trim()) {
    return { ok: false, reason: "Delivery address is required." };
  }

  // ---- Pull authoritative settings ----
  const settings = await getRestaurantSettings();

  if (input.fulfillment === "delivery" && !settings.deliveryEnabled) {
    return {
      ok: false,
      reason:
        "Delivery is currently disabled. Please choose takeaway or in-room dining.",
    };
  }

  if (input.fulfillment === "delivery") {
    const check = checkDeliveryRadius({
      customerLat: input.deliveryLat ?? null,
      customerLng: input.deliveryLng ?? null,
      restaurantLat: settings.restaurantLat,
      restaurantLng: settings.restaurantLng,
      radiusKm: settings.deliveryRadiusKm,
    });
    if (check.kind === "outside") {
      return {
        ok: false,
        reason: `Sorry, you're ${check.km.toFixed(1)} km away — outside our ${check.limitKm} km delivery range. Try takeaway instead.`,
      };
    }
  }

  // ---- Mint a provider order id ----
  const provider = activePaymentProvider();
  let providerOrderId: string;
  if (provider === "demo") {
    providerOrderId = `demo_order_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  } else {
    // Razorpay provider would call its `/orders` API here and use the
    // returned id. Throw for now so a half-built Razorpay setup can't
    // silently mismatch ids.
    return {
      ok: false,
      reason:
        "Razorpay provider is not implemented yet. Set PAYMENT_PROVIDER=demo or implement the Razorpay path.",
    };
  }

  // ---- Server-side tax (matches the COD flow's pricing authority) ----
  const taxPaise = await computeServerSideTax(input.cart, settings.gstPercent);
  const deliveryFeePaise =
    input.fulfillment === "delivery" ? settings.deliveryFeePaise : 0;

  // ---- Insert the order ----
  const result = await createOrder({
    fulfillment: input.fulfillment,
    paymentMode: "online",
    provider,
    providerOrderId,

    customerName: input.customerName.trim(),
    customerPhone: phoneDigits,
    customerEmail: input.customerEmail?.trim() || null,

    roomNumber: input.roomNumber?.trim() || null,
    addressLine: input.addressLine?.trim() || null,
    addressLandmark: input.addressLandmark?.trim() || null,
    addressPincode: input.addressPincode?.trim() || null,
    deliveryLat: input.deliveryLat ?? null,
    deliveryLng: input.deliveryLng ?? null,
    deliveryFeePaise,
    pickupTime: input.pickupTime || null,
    notes: input.notes?.trim() || null,
    taxPaise,
    cart: input.cart,
  });

  if (!result.ok) {
    return { ok: false, reason: result.reason };
  }

  // ---- Re-fetch the priced lines for the modal summary. One extra read
  //      keeps the modal showing exactly what the DB recorded. ----
  const persisted = await getOrderWithLines(result.orderId);
  if (!persisted) {
    // Extremely unlikely (we just inserted it). Bail by cancelling so we
    // don't strand a paid row in some weird middle state.
    await cancelOrderPayment(providerOrderId);
    return {
      ok: false,
      reason: "Order vanished after creation. Please try again.",
    };
  }

  const order: FoodPaymentOrder = {
    kind: "food",
    orderId: providerOrderId,
    foodOrderId: persisted.id,
    amount: persisted.totalPaise,
    currency: "INR",
    receipt: persisted.shortCode,
    provider,
    food: {
      shortCode: persisted.shortCode,
      fulfillment: persisted.fulfillment,
      items: persisted.lines.map((l) => ({
        name: l.nameSnapshot,
        variant: l.variant,
        qty: l.qty,
        lineTotalPaise: l.lineTotalPaise,
      })),
      subtotalPaise: persisted.subtotalPaise,
      deliveryFeePaise: persisted.deliveryFeePaise,
      taxPaise: persisted.taxPaise,
    },
  };

  return { ok: true, order };
}

export type ConfirmOnlinePaymentResult =
  | { ok: true; orderId: string }
  | { ok: false; reason: string };

export async function confirmOnlinePayment(
  providerOrderId: string,
  paymentResponse: {
    /** Demo flow: just a flag. Razorpay would pass razorpay_payment_id +
     *  razorpay_signature here, and we'd verify the signature against
     *  RAZORPAY_KEY_SECRET before marking the payment paid. */
    simulated?: boolean;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }
): Promise<ConfirmOnlinePaymentResult> {
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
    return {
      ok: false,
      reason:
        "Razorpay confirmOnlinePayment is not implemented yet. Verify the " +
        "razorpay_signature against RAZORPAY_KEY_SECRET before marking paid.",
    };
  }

  const result = await confirmOrderPayment(providerOrderId, paymentId);
  if (!result.ok) return { ok: false, reason: result.reason };

  // Fire-and-log admin WhatsApp ping. Must not roll back the confirmed
  // payment if the notifier flakes.
  sendAdminOrderNotification(result.orderId).catch((err) => {
    // eslint-disable-next-line no-console
    console.warn(
      "[whatsapp] order notification threw:",
      err instanceof Error ? err.message : String(err)
    );
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${result.orderId}`);
  revalidatePath(`/restaurant/order/track/${result.orderId}`);

  return { ok: true, orderId: result.orderId };
}

/** Online payment failed (provider rejected or signature mismatch, or the
 *  "Simulate failure" button in the demo modal). Cancels the order so it
 *  doesn't sit pending forever. */
export async function failOnlinePayment(
  providerOrderId: string,
  reason: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const result = await failOrderPayment(providerOrderId, reason);
  if (result.ok) {
    revalidatePath("/admin/orders");
  }
  return result;
}

/** User dismissed the modal without paying. Same effect as failure for our
 *  purposes — the order is cancelled and no money was ever taken. */
export async function cancelOnlinePayment(
  providerOrderId: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const result = await cancelOrderPayment(providerOrderId);
  if (result.ok) {
    revalidatePath("/admin/orders");
  }
  return result;
}
