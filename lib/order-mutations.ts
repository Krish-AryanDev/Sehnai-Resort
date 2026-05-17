import "server-only";
import { randomBytes } from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getMenuItemsByIds } from "@/lib/menu-repo";

/**
 * Server-side write helpers for the restaurant ordering system. Service-
 * role only — direct mirror of /lib/booking-mutations.ts so the room and
 * food flows share the same shape, the same payment-provider seam, and
 * the same pending → confirmed/failed/cancelled lifecycle.
 *
 * Callers must already be running inside server actions or route handlers
 * that gate on the right context (admin auth for kitchen-side mutations,
 * the order-create server action for public flows).
 *
 * Price authority: the line-item totals here are computed from menu_items
 * as it exists in the DB at order time, NOT from numbers the client sent.
 * The client passes (menu_item_id, variant, qty); the server re-prices it.
 * This is how we keep the order honest against a tampered cart payload.
 */

/* ============================================================
 * Types
 * ============================================================ */

export type Fulfillment = "in_room" | "takeaway" | "delivery";
export type PaymentMode = "online" | "cod";
export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type Variant = "single" | "half" | "full";

/** What the client's cart sends. Quantities and (item, variant) pairs only —
 *  no prices, no totals. The server re-prices everything. */
export type CartLineInput = {
  menuItemId: string;
  variant: Variant;
  qty: number;
};

export type CreateOrderArgs = {
  fulfillment: Fulfillment;
  paymentMode: PaymentMode;

  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;

  // in_room
  roomNumber?: string | null;
  // delivery
  addressLine?: string | null;
  addressLandmark?: string | null;
  addressPincode?: string | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  deliveryFeePaise?: number;     // looked up from restaurant_settings by caller
  // takeaway
  pickupTime?: string | null;    // ISO

  notes?: string | null;
  taxPaise?: number;             // computed by caller from settings.gstPercent

  /** When paymentMode='online' the caller has already minted a provider
   *  order id via the payment-provider seam. COD paths leave both null. */
  provider?: "demo" | "razorpay" | null;
  providerOrderId?: string | null;

  cart: CartLineInput[];
};

export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      shortCode: string;
      subtotalPaise: number;
      totalPaise: number;
    }
  | { ok: false; reason: string };

/* ============================================================
 * Short-code generator — UI-friendly receipt id ("FD-A3K9").
 * Crockford base32 (no I/L/O/U) so it's unambiguous when read aloud.
 * 4 chars from /dev/urandom → 1M possibilities; collisions are caught
 * by the unique index on short_code and we just retry.
 * ============================================================ */

const SHORT_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789"; // 30 chars
function generateShortCode(): string {
  const buf = randomBytes(4);
  let out = "FD-";
  for (let i = 0; i < 4; i++) {
    out += SHORT_CODE_ALPHABET[buf[i] % SHORT_CODE_ALPHABET.length];
  }
  return out;
}

/* ============================================================
 * createOrder — the meat of the write path.
 *
 * 1. Re-fetch all menu items in the cart (single round-trip).
 * 2. Validate availability and variant pricing per line.
 * 3. Compute subtotal / total using DB-side prices.
 * 4. Insert order header + items in two statements (no transaction —
 *    PostgREST doesn't expose one; if step 2 fails the order is orphaned
 *    but cascade-deleted when admin cleans up).
 *
 * Returns the new order id + receipt code on success.
 * ============================================================ */

export async function createOrder(
  args: CreateOrderArgs
): Promise<CreateOrderResult> {
  // ---- Input shape ----
  if (args.cart.length === 0) {
    return { ok: false, reason: "Cart is empty." };
  }
  if (!args.customerName.trim() || !args.customerPhone.trim()) {
    return { ok: false, reason: "Customer name and phone are required." };
  }
  if (args.fulfillment === "in_room" && !args.roomNumber?.trim()) {
    return { ok: false, reason: "Room number is required for in-room orders." };
  }
  if (args.fulfillment === "delivery" && !args.addressLine?.trim()) {
    return { ok: false, reason: "Delivery address is required." };
  }
  if (args.paymentMode === "online" && !args.providerOrderId) {
    return {
      ok: false,
      reason:
        "providerOrderId is required for online payments. Mint one via the " +
        "payment-provider seam before calling createOrder.",
    };
  }

  // ---- Re-price from authoritative menu rows ----
  const ids = Array.from(new Set(args.cart.map((l) => l.menuItemId)));
  const itemsById = await getMenuItemsByIds(ids);

  type PricedLine = {
    menuItemId: string;
    variant: Variant;
    qty: number;
    nameSnapshot: string;
    unitPricePaise: number;
    lineTotalPaise: number;
  };
  const priced: PricedLine[] = [];

  for (const line of args.cart) {
    const item = itemsById.get(line.menuItemId);
    if (!item) {
      return { ok: false, reason: `Item ${line.menuItemId} no longer exists.` };
    }
    if (!item.isAvailable) {
      return { ok: false, reason: `"${item.name}" is currently unavailable.` };
    }
    if (!Number.isInteger(line.qty) || line.qty < 1) {
      return { ok: false, reason: `Invalid quantity for "${item.name}".` };
    }

    const unit =
      line.variant === "single"
        ? item.priceSinglePaise
        : line.variant === "half"
        ? item.priceHalfPaise
        : item.priceFullPaise;

    if (unit == null) {
      return {
        ok: false,
        reason: `"${item.name}" is not sold by ${line.variant} portion.`,
      };
    }

    priced.push({
      menuItemId: item.id,
      variant: line.variant,
      qty: line.qty,
      nameSnapshot: item.name,
      unitPricePaise: unit,
      lineTotalPaise: unit * line.qty,
    });
  }

  const subtotalPaise = priced.reduce((s, l) => s + l.lineTotalPaise, 0);
  const deliveryFeePaise =
    args.fulfillment === "delivery" ? args.deliveryFeePaise ?? 0 : 0;
  const taxPaise = args.taxPaise ?? 0;
  const totalPaise = subtotalPaise + deliveryFeePaise + taxPaise;

  // ---- Insert order header ----
  const supabase = getSupabaseAdminClient();

  // Retry once on short_code collision (1-in-810k odds; cheap insurance).
  let shortCode = generateShortCode();
  let inserted:
    | { id: string; short_code: string }
    | null = null;
  let lastErr: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await supabase
      .from("restaurant_orders")
      .insert({
        short_code: shortCode,
        fulfillment: args.fulfillment,
        status: "placed",
        customer_name: args.customerName.trim(),
        customer_phone: args.customerPhone.trim(),
        customer_email: args.customerEmail?.trim() || null,
        room_number: args.roomNumber?.trim() || null,
        address_line: args.addressLine?.trim() || null,
        address_landmark: args.addressLandmark?.trim() || null,
        address_pincode: args.addressPincode?.trim() || null,
        delivery_lat: args.deliveryLat ?? null,
        delivery_lng: args.deliveryLng ?? null,
        pickup_time: args.pickupTime || null,
        subtotal_paise: subtotalPaise,
        delivery_fee_paise: deliveryFeePaise,
        tax_paise: taxPaise,
        total_paise: totalPaise,
        payment_mode: args.paymentMode,
        payment_status: "pending",
        provider: args.provider ?? null,
        provider_order_id: args.providerOrderId ?? null,
        notes: args.notes?.trim() || null,
      })
      .select("id, short_code")
      .single();

    if (!error && data) {
      inserted = data;
      break;
    }

    lastErr = error?.message ?? "Insert failed.";
    // Collision on short_code — regenerate and retry once.
    if (lastErr.includes("restaurant_orders_short_code_key")) {
      shortCode = generateShortCode();
      continue;
    }
    break;
  }

  if (!inserted) {
    return { ok: false, reason: lastErr ?? "Insert failed." };
  }

  // ---- Insert line items in one batch ----
  const lineRows = priced.map((l) => ({
    order_id: inserted!.id,
    menu_item_id: l.menuItemId,
    name_snapshot: l.nameSnapshot,
    variant: l.variant,
    unit_price_paise: l.unitPricePaise,
    qty: l.qty,
    line_total_paise: l.lineTotalPaise,
  }));

  const { error: linesErr } = await supabase
    .from("order_items")
    .insert(lineRows);

  if (linesErr) {
    // Best-effort rollback of the header; cascade FK takes any orphans.
    await supabase
      .from("restaurant_orders")
      .delete()
      .eq("id", inserted.id);
    return { ok: false, reason: linesErr.message };
  }

  return {
    ok: true,
    orderId: inserted.id,
    shortCode: inserted.short_code,
    subtotalPaise,
    totalPaise,
  };
}

/* ============================================================
 * Payment lifecycle — direct mirror of booking-mutations.ts.
 * The order is created with payment_status='pending'; the payment-
 * provider callback flips it to paid or failed.
 * ============================================================ */

/** Online payment succeeded. Stamps provider_payment_id and flips payment
 *  status to 'paid'. The order's overall `status` ('placed', 'accepted'…)
 *  is independent of payment_status — kitchen advances it separately. */
export async function confirmOrderPayment(
  providerOrderId: string,
  providerPaymentId: string
): Promise<{ ok: true; orderId: string } | { ok: false; reason: string }> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("restaurant_orders")
    .update({
      payment_status: "paid",
      provider_payment_id: providerPaymentId,
      updated_at: new Date().toISOString(),
    })
    .eq("provider_order_id", providerOrderId)
    .eq("payment_status", "pending")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, reason: error.message };
  if (!data) {
    return {
      ok: false,
      reason: "Order not found or payment no longer pending.",
    };
  }
  return { ok: true, orderId: data.id };
}

/** Online payment failed (provider rejected or signature mismatch). */
export async function failOrderPayment(
  providerOrderId: string,
  failureReason: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("restaurant_orders")
    .update({
      payment_status: "failed",
      status: "cancelled",
      cancelled_reason: failureReason.slice(0, 200) || "Payment failed.",
      updated_at: new Date().toISOString(),
    })
    .eq("provider_order_id", providerOrderId)
    .eq("payment_status", "pending");

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

/** User dismissed the checkout UI without paying. */
export async function cancelOrderPayment(
  providerOrderId: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("restaurant_orders")
    .update({
      status: "cancelled",
      payment_status: "failed",
      cancelled_reason: "Customer dismissed checkout.",
      updated_at: new Date().toISOString(),
    })
    .eq("provider_order_id", providerOrderId)
    .eq("payment_status", "pending");

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

/* ============================================================
 * Kitchen-side status mutations (used by /admin/orders in Phase 6).
 * Exposed here so the schema knowledge stays in one file; the admin UI
 * will wrap these in server actions gated by requireAdmin().
 * ============================================================ */

/** Defines the allowed forward transitions of the kitchen status machine.
 *  Returns null when there is no next step (delivered or cancelled). */
export function nextOrderStatus(current: OrderStatus): OrderStatus | null {
  switch (current) {
    case "placed":
      return "accepted";
    case "accepted":
      return "preparing";
    case "preparing":
      return "ready";
    case "ready":
      return "out_for_delivery";
    case "out_for_delivery":
      return "delivered";
    default:
      return null;
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("restaurant_orders")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

/** Admin marks a COD order paid once cash/UPI is collected on delivery. */
export async function markCodPaid(
  orderId: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("restaurant_orders")
    .update({
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("payment_mode", "cod")
    .eq("payment_status", "pending");

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function cancelOrder(
  orderId: string,
  reason: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("restaurant_orders")
    .update({
      status: "cancelled",
      cancelled_reason: reason.slice(0, 200) || "Cancelled by staff.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .neq("status", "delivered");

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}
