import "server-only";
import { getOrderWithLines } from "@/lib/order-repo";
import {
  notifyAdmin,
  notifyCustomer,
  formatOrderConfirmationMessage,
  formatOrderStatusMessage,
} from "@/lib/whatsapp-notifier";
import type { OrderStatus } from "@/lib/order-mutations";

/**
 * Server-only notification helpers for the food-ordering flow.
 *
 * Two surfaces:
 *   - `sendAdminOrderNotification(orderId)` — fired on COD placement (in
 *     [restaurant/order/_actions/place-order.ts](../app/[locale]/restaurant/order/_actions/place-order.ts))
 *     and online payment confirmation (in [online-payment.ts](../app/[locale]/restaurant/order/_actions/online-payment.ts)).
 *   - `sendCustomerStatusNotification(orderId)` — fired on each kitchen
 *     status advance and on cancel (in [admin/orders/actions.ts](../app/[locale]/admin/orders/actions.ts)).
 *
 * Both swallow every error. By the time these run, the order has already
 * committed; we never want a flaky WhatsApp endpoint to roll back the
 * customer's order or the kitchen's status change.
 */

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "";
}

/** WhatsApp the admin a freshly-placed/paid order. */
export async function sendAdminOrderNotification(orderId: string): Promise<void> {
  try {
    const order = await getOrderWithLines(orderId);
    if (!order) {
      // eslint-disable-next-line no-console
      console.warn("[whatsapp] order not found for notification:", orderId);
      return;
    }

    const url = baseUrl();
    const adminUrl = url ? `${url}/admin/orders/${order.id}` : null;

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
      console.warn("[whatsapp] admin notify failed:", result.error);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      "[whatsapp] admin notification threw:",
      err instanceof Error ? err.message : String(err)
    );
  }
}

/** Status values that warrant a customer ping. `placed` is excluded — the
 *  customer just submitted, no need to echo back. */
const NOTIFIABLE_STATUSES = new Set<OrderStatus>([
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

/** Fetch the order and WhatsApp the customer their new status. Re-fetching
 *  (rather than threading data in from the caller) keeps the message in
 *  step with whatever the DB actually committed — including any
 *  cancellation reason the staff just typed. */
export async function sendCustomerStatusNotification(
  orderId: string
): Promise<void> {
  try {
    const order = await getOrderWithLines(orderId);
    if (!order) {
      // eslint-disable-next-line no-console
      console.warn("[whatsapp] order not found for status ping:", orderId);
      return;
    }

    if (!NOTIFIABLE_STATUSES.has(order.status)) {
      return;
    }

    const url = baseUrl();
    const trackingUrl = url
      ? `${url}/restaurant/order/track/${order.id}`
      : null;

    const message = formatOrderStatusMessage({
      shortCode: order.shortCode,
      status: order.status as
        | "accepted"
        | "preparing"
        | "ready"
        | "out_for_delivery"
        | "delivered"
        | "cancelled",
      fulfillment: order.fulfillment,
      customerName: order.customerName,
      cancelledReason: order.cancelledReason,
      trackingUrl,
    });

    // The formatter returns null for transitions that don't apply to this
    // fulfillment (e.g. out_for_delivery on an in-room order). Skip the send.
    if (!message) return;

    const result = await notifyCustomer(order.customerPhone, message);
    if (!result.ok) {
      // eslint-disable-next-line no-console
      console.warn("[whatsapp] customer notify failed:", result.error);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      "[whatsapp] customer notification threw:",
      err instanceof Error ? err.message : String(err)
    );
  }
}
