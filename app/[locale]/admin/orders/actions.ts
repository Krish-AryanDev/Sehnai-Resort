"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import {
  cancelOrder,
  markCodPaid,
  nextOrderStatus,
  updateOrderStatus,
  type OrderStatus,
} from "@/lib/order-mutations";
import { sendCustomerStatusNotification } from "@/lib/order-notify";

/**
 * Kitchen-side actions for /admin/orders/[id]. All gated by requireAdmin.
 *
 * Status mutations re-validate both the admin list (so a bumped status
 * reflects in the queue) and the customer's tracking page (so the next
 * refresh shows the new step). The order detail page itself is
 * force-dynamic so it'll re-render with the new status on the redirect.
 *
 * Phase 6: customer WhatsApp pings fire fire-and-log on every successful
 * advance and cancel. Realtime updates on the customer's tracking page
 * piggyback on `revalidatePath` since that page subscribes to the row's
 * `postgres_changes` and calls `router.refresh()` on each update.
 */

function str(fd: FormData, key: string): string {
  return (fd.get(key) ?? "").toString();
}

function bustOrderCaches(orderId: string): void {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/restaurant/order/track/${orderId}`);
}

function failToDetail(orderId: string, msg: string): never {
  redirect(`/admin/orders/${orderId}?error=${encodeURIComponent(msg)}`);
}
function backToDetail(orderId: string, ok: string): never {
  redirect(`/admin/orders/${orderId}?ok=${encodeURIComponent(ok)}`);
}

export async function advanceOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const orderId = str(formData, "id").trim();
  const expectedStatus = str(formData, "currentStatus").trim() as OrderStatus;
  if (!orderId) failToDetail(orderId, "Missing order id.");

  const next = nextOrderStatus(expectedStatus);
  if (!next) {
    failToDetail(orderId, "This order has no further steps.");
  }

  const result = await updateOrderStatus(orderId, next);
  if (!result.ok) {
    failToDetail(orderId, result.reason);
  }

  bustOrderCaches(orderId);
  // Fire-and-log customer WhatsApp ping. The formatter skips
  // out_for_delivery for non-delivery orders and skips 'placed' entirely.
  notifyCustomerSafe(orderId);
  backToDetail(orderId, `status-${next}`);
}

export async function cancelOrderAction(formData: FormData) {
  await requireAdmin();
  const orderId = str(formData, "id").trim();
  const reason = str(formData, "reason").trim() || "Cancelled by staff.";
  if (!orderId) failToDetail(orderId, "Missing order id.");

  const result = await cancelOrder(orderId, reason);
  if (!result.ok) {
    failToDetail(orderId, result.reason);
  }
  bustOrderCaches(orderId);
  notifyCustomerSafe(orderId);
  backToDetail(orderId, "cancelled");
}

/** Fire-and-log wrapper around the customer status helper. Detached from
 *  the awaited path so a slow / failing WhatsApp endpoint never blocks
 *  the kitchen UI from redirecting back to the order detail page. */
function notifyCustomerSafe(orderId: string): void {
  sendCustomerStatusNotification(orderId).catch((err) => {
    // eslint-disable-next-line no-console
    console.warn(
      "[whatsapp] customer status notification threw:",
      err instanceof Error ? err.message : String(err)
    );
  });
}

export async function markCodPaidAction(formData: FormData) {
  await requireAdmin();
  const orderId = str(formData, "id").trim();
  if (!orderId) failToDetail(orderId, "Missing order id.");

  const result = await markCodPaid(orderId);
  if (!result.ok) {
    failToDetail(orderId, result.reason);
  }
  bustOrderCaches(orderId);
  backToDetail(orderId, "paid");
}
