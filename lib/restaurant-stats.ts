import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Fulfillment, OrderStatus, PaymentMode, PaymentStatus } from "@/lib/order-mutations";

/**
 * Server-only aggregator powering /admin/restaurant.
 *
 * Trade-off note: there's no GROUP BY in PostgREST, so the per-status
 * kitchen counts and top-items aggregation fetch the last N rows and
 * reduce in JS. That's fine at restaurant scale — the table is bounded
 * to a few hundred orders per week. If volume ever grows past ~10k rows
 * per query we'd push the math into a `create function` in Postgres and
 * call it via supabase.rpc(). Not premature.
 */

export type RestaurantStats = {
  kpis: {
    today: { orders: number; revenuePaise: number };
    week: { orders: number; revenuePaise: number };
    activeInKitchen: number;
    pendingCod: { count: number; amountPaise: number };
  };
  kitchen: Record<KitchenStatus, number>;
  recentOrders: RecentOrderSummary[];
  topItems: TopItem[];
  menuHealth: {
    hiddenCategories: number;
    unavailableItems: number;
    totalCategories: number;
    totalItems: number;
  };
};

/** Status buckets the kitchen actively works on. delivered/cancelled
 *  excluded — those don't need a tile on the kitchen pulse. */
export const KITCHEN_STATUSES = [
  "placed",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
] as const;
export type KitchenStatus = (typeof KITCHEN_STATUSES)[number];

export type RecentOrderSummary = {
  id: string;
  shortCode: string;
  customerName: string;
  customerPhone: string;
  roomNumber: string | null;
  fulfillment: Fulfillment;
  status: OrderStatus;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  totalPaise: number;
  createdAt: string;
};

export type TopItem = {
  name: string;
  qty: number;
  revenuePaise: number;
};

/* ============================================================
 * Date math — anchored to the server's local timezone. The kitchen
 * cares about "today as the kitchen experiences it", not UTC midnight.
 * ============================================================ */

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function sevenDaysAgoIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 6); // today + 6 prior days = 7-day window
  return d.toISOString();
}

/* ============================================================
 * Public entry
 * ============================================================ */

export async function getRestaurantStats(): Promise<RestaurantStats> {
  const supabase = getSupabaseAdminClient();
  const todayStart = startOfTodayIso();
  const weekStart = sevenDaysAgoIso();

  // All queries run in parallel — they're independent.
  const [
    weekOrdersRes,
    activeOrdersRes,
    pendingCodRes,
    recentOrdersRes,
    weekItemsRes,
    categoriesRes,
    itemsRes,
  ] = await Promise.all([
    // Past-week orders — drives today's KPIs AND week KPIs (we filter in JS).
    supabase
      .from("restaurant_orders")
      .select("id, total_paise, status, created_at")
      .gte("created_at", weekStart)
      .neq("status", "cancelled"),

    // Active in kitchen (everything not delivered/cancelled).
    supabase
      .from("restaurant_orders")
      .select("status")
      .in("status", KITCHEN_STATUSES as unknown as string[]),

    // Outstanding cash collection.
    supabase
      .from("restaurant_orders")
      .select("total_paise")
      .eq("payment_mode", "cod")
      .eq("payment_status", "pending")
      .neq("status", "cancelled"),

    // Newest 8 across all statuses — gives a feel for live activity.
    supabase
      .from("restaurant_orders")
      .select(
        "id, short_code, customer_name, customer_phone, room_number, fulfillment, status, payment_mode, payment_status, total_paise, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(8),

    // Items in past week's orders for top-N. We pull the inner join so we
    // can drop lines from cancelled orders without a second query.
    supabase
      .from("order_items")
      .select(
        "name_snapshot, qty, line_total_paise, restaurant_orders!inner(created_at, status)"
      )
      .gte("restaurant_orders.created_at", weekStart)
      .neq("restaurant_orders.status", "cancelled"),

    // Menu health.
    supabase.from("menu_categories").select("is_active"),
    supabase.from("menu_items").select("is_available"),
  ]);

  // ---- KPIs ----
  type WeekOrderRow = { id: string; total_paise: number; status: OrderStatus; created_at: string };
  const weekOrders: WeekOrderRow[] = (weekOrdersRes.data as WeekOrderRow[] | null) ?? [];

  const todayOrders = weekOrders.filter((o) => o.created_at >= todayStart);
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total_paise, 0);
  const weekRevenue = weekOrders.reduce((s, o) => s + o.total_paise, 0);

  const activeInKitchen =
    (activeOrdersRes.data as { status: OrderStatus }[] | null)?.length ?? 0;

  const pendingCodRows =
    (pendingCodRes.data as { total_paise: number }[] | null) ?? [];
  const pendingCod = {
    count: pendingCodRows.length,
    amountPaise: pendingCodRows.reduce((s, r) => s + r.total_paise, 0),
  };

  // ---- Kitchen status buckets ----
  const kitchen: Record<KitchenStatus, number> = {
    placed: 0,
    accepted: 0,
    preparing: 0,
    ready: 0,
    out_for_delivery: 0,
  };
  for (const row of (activeOrdersRes.data as { status: OrderStatus }[] | null) ?? []) {
    if (row.status in kitchen) kitchen[row.status as KitchenStatus]++;
  }

  // ---- Recent orders ----
  type RecentRow = {
    id: string;
    short_code: string;
    customer_name: string;
    customer_phone: string;
    room_number: string | null;
    fulfillment: Fulfillment;
    status: OrderStatus;
    payment_mode: PaymentMode;
    payment_status: PaymentStatus;
    total_paise: number;
    created_at: string;
  };
  const recentOrders: RecentOrderSummary[] = (
    (recentOrdersRes.data as RecentRow[] | null) ?? []
  ).map((r) => ({
    id: r.id,
    shortCode: r.short_code,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    roomNumber: r.room_number,
    fulfillment: r.fulfillment,
    status: r.status,
    paymentMode: r.payment_mode,
    paymentStatus: r.payment_status,
    totalPaise: r.total_paise,
    createdAt: r.created_at,
  }));

  // ---- Top items (last 7 days) ----
  type WeekItemRow = {
    name_snapshot: string;
    qty: number;
    line_total_paise: number;
  };
  const itemRows = (weekItemsRes.data as WeekItemRow[] | null) ?? [];
  const itemAgg = new Map<string, { qty: number; revenuePaise: number }>();
  for (const r of itemRows) {
    const cur = itemAgg.get(r.name_snapshot) ?? { qty: 0, revenuePaise: 0 };
    cur.qty += r.qty;
    cur.revenuePaise += r.line_total_paise;
    itemAgg.set(r.name_snapshot, cur);
  }
  const topItems: TopItem[] = Array.from(itemAgg.entries())
    .map(([name, v]) => ({ name, qty: v.qty, revenuePaise: v.revenuePaise }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // ---- Menu health ----
  const cats =
    (categoriesRes.data as { is_active: boolean }[] | null) ?? [];
  const items =
    (itemsRes.data as { is_available: boolean }[] | null) ?? [];

  return {
    kpis: {
      today: { orders: todayOrders.length, revenuePaise: todayRevenue },
      week: { orders: weekOrders.length, revenuePaise: weekRevenue },
      activeInKitchen,
      pendingCod,
    },
    kitchen,
    recentOrders,
    topItems,
    menuHealth: {
      hiddenCategories: cats.filter((c) => !c.is_active).length,
      unavailableItems: items.filter((i) => !i.is_available).length,
      totalCategories: cats.length,
      totalItems: items.length,
    },
  };
}
