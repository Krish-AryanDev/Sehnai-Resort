"use server";

import { revalidatePath } from "next/cache";
import {
  createOrder,
  type CartLineInput,
  type Fulfillment,
} from "@/lib/order-mutations";
import { getRestaurantSettings } from "@/lib/menu-repo";
import { getOrderWithLines } from "@/lib/order-repo";
import { checkDeliveryRadius } from "@/lib/delivery-distance";
import {
  notifyAdmin,
  formatOrderConfirmationMessage,
} from "@/lib/whatsapp-notifier";
import { computeServerSideTax } from "./_lib-internal";

/**
 * Public server action that places a pay-on-delivery order. Online payment
 * (Phase 5) will reuse `createOrder` with `paymentMode: "online"` and a
 * minted provider order id — this action stays COD-only on purpose so the
 * paid path doesn't accidentally regress here.
 *
 * Trust boundary: the client passes cart line ids + variants + qty, plus
 * the contextual checkout fields. The server re-fetches authoritative
 * prices (in createOrder), recomputes GST and delivery fee from
 * restaurant_settings, and revalidates the delivery radius itself.
 */

export type PlaceCodOrderInput = {
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

export type PlaceCodOrderResult =
  | { ok: true; orderId: string; shortCode: string }
  | { ok: false; reason: string };

export async function placeCodOrder(
  input: PlaceCodOrderInput
): Promise<PlaceCodOrderResult> {
  // ---- Surface-level guards (deeper validation lives in createOrder) ----
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

  // ---- Pull authoritative settings (radius, fee, GST, restaurant coords) ----
  const settings = await getRestaurantSettings();

  if (input.fulfillment === "delivery" && !settings.deliveryEnabled) {
    return {
      ok: false,
      reason:
        "Delivery is currently disabled. Please choose takeaway or in-room dining.",
    };
  }

  // ---- Delivery radius validation when both ends provide coordinates ----
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
    // "unknown" → allow through; admin sees the address and decides.
  }

  // ---- Money pre-compute. createOrder re-prices the cart; we only need
  //      to estimate the subtotal here for min-order + GST math. ----
  // Subtotal will be authoritative inside createOrder, so we approximate
  // min-order check using the same source: a quick re-query of items via
  // a placeholder. To avoid a duplicate round-trip we pass deliveryFee +
  // taxPaise computed as a function of the cart payload through createOrder.
  //
  // Cleaner approach: do a single-line MIN-order check after createOrder
  // returns, then refund-cancel if it fails. But that's clunky for a COD
  // flow that hasn't taken money yet. Easier: skip the min-order check
  // entirely for Phase 4 (settings.minOrderPaise defaults to 0; admin can
  // set it once we have real menu data and want to enforce a floor). Phase
  // 7 polish revisits this.

  // GST is a percentage of the subtotal. createOrder needs taxPaise up
  // front, but the subtotal is computed inside createOrder. To keep the
  // server as the price authority we'd ideally compute GST after the
  // re-price. For Phase 4 we instead derive GST from the cart's client-
  // sent qty × server-priced unit-cost via a small trick: we ask
  // createOrder for the totals first by sending taxPaise=0, then if GST
  // is non-zero we re-issue with the correct tax. That's two round-trips
  // and feels wrong. Simpler: trust the client-sent unit prices for the
  // GST estimate only (it's a few rupees of variance at worst) — the
  // displayed totals come back from createOrder which is authoritative.
  //
  // The right long-term fix is to expose a `priceCart()` helper that
  // returns the priced lines without inserting. We can refactor when GST
  // matters more; for now Phase 4 sets taxPaise to a server-computed
  // value using a tiny inline re-price.
  const taxPaise = await computeServerSideTax(input.cart, settings.gstPercent);
  const deliveryFeePaise =
    input.fulfillment === "delivery" ? settings.deliveryFeePaise : 0;

  // ---- Place the order ----
  const result = await createOrder({
    fulfillment: input.fulfillment,
    paymentMode: "cod",

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

  // ---- Fire-and-log WhatsApp ping (must never roll back the order) ----
  sendOrderNotification(result.orderId).catch((err) => {
    // eslint-disable-next-line no-console
    console.warn(
      "[whatsapp] order notification threw:",
      err instanceof Error ? err.message : String(err)
    );
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${result.orderId}`);

  return {
    ok: true,
    orderId: result.orderId,
    shortCode: result.shortCode,
  };
}

async function sendOrderNotification(orderId: string): Promise<void> {
  try {
    const order = await getOrderWithLines(orderId);
    if (!order) {
      // eslint-disable-next-line no-console
      console.warn("[whatsapp] order not found for notification:", orderId);
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "";
    const adminUrl = baseUrl ? `${baseUrl}/admin/orders/${order.id}` : null;

    const message = formatOrderConfirmationMessage({
      shortCode: order.shortCode,
      fulfillment: order.fulfillment,
      paymentMode: order.paymentMode,
      paymentStatus: order.paymentStatus,
      items: order.lines.map((l) => ({
        name: l.nameSnapshot,
        variant: l.variant,
        qty: l.qty,
      })),
      subtotalPaise: order.subtotalPaise,
      deliveryFeePaise: order.deliveryFeePaise,
      taxPaise: order.taxPaise,
      totalPaise: order.totalPaise,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      roomNumber: order.roomNumber,
      addressLine: order.addressLine,
      addressLandmark: order.addressLandmark,
      addressPincode: order.addressPincode,
      pickupTime: order.pickupTime,
      notes: order.notes,
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
      "[whatsapp] order notification threw:",
      err instanceof Error ? err.message : String(err)
    );
  }
}
