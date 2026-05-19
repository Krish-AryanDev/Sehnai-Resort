import { notFound } from "next/navigation";
import { getOrderWithLines } from "@/lib/order-repo";
import { TrackingClient } from "./TrackingClient";

export const dynamic = "force-dynamic";

/**
 * Server component for the customer order tracking page. Reads the order
 * via the service-role client (the table has no anon SELECT for the row
 * BODY — Phase 6 only granted anon access for realtime change events, see
 * [0011_orders_realtime.sql](../../../../../db/migrations/0011_orders_realtime.sql))
 * and hands off to [TrackingClient](./TrackingClient.tsx), which owns the
 * realtime subscription + polling fallback.
 *
 * Because this page is `force-dynamic`, `router.refresh()` from the client
 * triggers a fresh server read — the realtime subscription is just the
 * trigger, the data still flows through the secure server path.
 */
export default async function OrderTrackPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const order = await getOrderWithLines(id);
  if (!order) notFound();

  return <TrackingClient order={order} />;
}
