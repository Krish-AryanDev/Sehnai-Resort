import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type {
  Fulfillment,
  OrderStatus,
  PaymentMode,
  PaymentStatus,
  Variant,
} from "@/lib/order-mutations";

/**
 * Server-only read layer for restaurant_orders. The table has no anon RLS
 * grants on purpose (see comment in 0007_restaurant_orders.sql), so every
 * read goes through the service-role client here and is gated by the
 * caller — admin pages or the public tracking page (which the customer
 * can only reach with the order's UUID).
 */

export type OrderLine = {
  id: string;
  menuItemId: string | null;
  nameSnapshot: string;
  variant: Variant;
  unitPricePaise: number;
  qty: number;
  lineTotalPaise: number;
};

export type OrderRow = {
  id: string;
  shortCode: string;
  fulfillment: Fulfillment;
  status: OrderStatus;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;

  customerName: string;
  customerPhone: string;
  customerEmail: string | null;

  roomNumber: string | null;
  addressLine: string | null;
  addressLandmark: string | null;
  addressPincode: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  pickupTime: string | null;

  subtotalPaise: number;
  deliveryFeePaise: number;
  taxPaise: number;
  totalPaise: number;

  provider: string | null;
  providerOrderId: string | null;
  notes: string | null;
  cancelledReason: string | null;

  createdAt: string;
  updatedAt: string;
};

export type OrderWithLines = OrderRow & {
  lines: OrderLine[];
};

const ORDER_COLUMNS =
  "id, short_code, fulfillment, status, payment_mode, payment_status, " +
  "customer_name, customer_phone, customer_email, " +
  "room_number, address_line, address_landmark, address_pincode, " +
  "delivery_lat, delivery_lng, pickup_time, " +
  "subtotal_paise, delivery_fee_paise, tax_paise, total_paise, " +
  "provider, provider_order_id, notes, cancelled_reason, " +
  "created_at, updated_at";

type DbOrder = {
  id: string;
  short_code: string;
  fulfillment: Fulfillment;
  status: OrderStatus;
  payment_mode: PaymentMode;
  payment_status: PaymentStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  room_number: string | null;
  address_line: string | null;
  address_landmark: string | null;
  address_pincode: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  pickup_time: string | null;
  subtotal_paise: number;
  delivery_fee_paise: number;
  tax_paise: number;
  total_paise: number;
  provider: string | null;
  provider_order_id: string | null;
  notes: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
};

type DbLine = {
  id: string;
  menu_item_id: string | null;
  name_snapshot: string;
  variant: Variant;
  unit_price_paise: number;
  qty: number;
  line_total_paise: number;
};

function mapOrder(r: DbOrder): OrderRow {
  return {
    id: r.id,
    shortCode: r.short_code,
    fulfillment: r.fulfillment,
    status: r.status,
    paymentMode: r.payment_mode,
    paymentStatus: r.payment_status,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    customerEmail: r.customer_email,
    roomNumber: r.room_number,
    addressLine: r.address_line,
    addressLandmark: r.address_landmark,
    addressPincode: r.address_pincode,
    deliveryLat: r.delivery_lat,
    deliveryLng: r.delivery_lng,
    pickupTime: r.pickup_time,
    subtotalPaise: r.subtotal_paise,
    deliveryFeePaise: r.delivery_fee_paise,
    taxPaise: r.tax_paise,
    totalPaise: r.total_paise,
    provider: r.provider,
    providerOrderId: r.provider_order_id,
    notes: r.notes,
    cancelledReason: r.cancelled_reason,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapLine(r: DbLine): OrderLine {
  return {
    id: r.id,
    menuItemId: r.menu_item_id,
    nameSnapshot: r.name_snapshot,
    variant: r.variant,
    unitPricePaise: r.unit_price_paise,
    qty: r.qty,
    lineTotalPaise: r.line_total_paise,
  };
}

/** Order header + line items in one round-trip's worth of API calls.
 *  Returns null when the UUID doesn't exist (404 territory). */
export async function getOrderWithLines(
  orderId: string
): Promise<OrderWithLines | null> {
  const supabase = getSupabaseAdminClient();

  const [headerRes, linesRes] = await Promise.all([
    supabase
      .from("restaurant_orders")
      .select(ORDER_COLUMNS)
      .eq("id", orderId)
      .maybeSingle(),
    supabase
      .from("order_items")
      .select(
        "id, menu_item_id, name_snapshot, variant, unit_price_paise, qty, line_total_paise"
      )
      .eq("order_id", orderId),
  ]);

  if (headerRes.error || !headerRes.data) return null;
  if (linesRes.error) return null;

  // The ORDER_COLUMNS string is a const variable rather than an inline
  // literal, so Supabase's type inference collapses to GenericStringError
  // and we have to cast through unknown. Runtime shape is unchanged.
  const header = mapOrder(headerRes.data as unknown as DbOrder);
  const lines = (linesRes.data as unknown as DbLine[]).map(mapLine);
  return { ...header, lines };
}

/** Newest-first list for the admin kitchen view. Capped at 200 — Phase 6's
 *  full kitchen view will tab by status; for now a hard limit is fine. */
export async function listOrdersForAdmin(): Promise<OrderRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("restaurant_orders")
    .select(ORDER_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];
  return (data as unknown as DbOrder[]).map(mapOrder);
}
