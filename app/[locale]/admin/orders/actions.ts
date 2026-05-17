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

/**
 * Kitchen-side actions for /admin/orders/[id]. All gated by requireAdmin.
 *
 * Status mutations re-validate both the admin list (so a bumped status
 * reflects in the queue) and the customer's tracking page (so the next
 * refresh shows the new step). The order detail page itself is
 * force-dynamic so it'll re-render with the new status on the redirect.
 *
 * Phase 6 will replace this thin shim with a kitchen view that drives the
 * same `updateOrderStatus` over a Supabase Realtime channel + per-status
 * tabs. The core mutations live in /lib/order-mutations.ts so that swap
 * is purely a UI change.
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
  backToDetail(orderId, "cancelled");
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
