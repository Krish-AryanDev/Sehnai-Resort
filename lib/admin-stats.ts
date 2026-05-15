import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { individualRooms, roomCategories } from "@/lib/rooms-data";

/**
 * Aggregates `room_bookings` rows into the shape the dashboard renders.
 *
 * Single fetch — all confirmed/pending bookings — then we compute totals,
 * monthly buckets, top variants, and recent activity in memory. Sane for
 * a 12-room hotel where total bookings/year << thousands.
 *
 * Revenue is computed at read-time from the in-code variant catalog
 * (variant.pricePerNight × nights). That keeps the schema lean — we don't
 * persist a `total` column that can drift from the catalog if prices
 * change. When pricing moves to DB (Phase B), this lookup migrates with it.
 *
 * "Revenue" only counts `confirmed` bookings. Pending/failed/cancelled are
 * excluded from money totals (they never reached a final paid state). They
 * DO show up in the recent-bookings list so the admin can see in-flight
 * activity.
 */

type BookingRow = {
  id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  status: "pending" | "confirmed" | "failed" | "cancelled";
  source: "admin" | "online";
  provider: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  created_at: string;
};

export type DashboardStats = {
  totals: {
    confirmedRevenue: number;
    confirmedBookings: number;
    avgBookingValue: number;
    thisMonthRevenue: number;
    thisMonthBookings: number;
    lastMonthRevenue: number;
    lastMonthBookings: number;
    pendingBookings: number;
  };
  monthlySeries: Array<{
    month: string; // "YYYY-MM"
    label: string; // "May"
    year: number;
    revenue: number;
    bookings: number;
  }>;
  topVariants: Array<{
    variantId: string;
    variantName: string;
    categoryName: string;
    bookings: number;
    revenue: number;
  }>;
  recentBookings: Array<{
    id: string;
    roomNumber: string;
    variantName: string;
    categoryName: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    total: number;
    guestName: string | null;
    guestPhone: string | null;
    guestEmail: string | null;
    status: BookingRow["status"];
    source: BookingRow["source"];
    provider: string | null;
    createdAt: string;
  }>;
};

export type DashboardResult =
  | { ok: true; stats: DashboardStats }
  | { ok: false; reason: string };

export async function getDashboardStats(): Promise<DashboardResult> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("room_bookings")
    .select(
      "id, room_id, check_in, check_out, status, source, provider, guest_name, guest_phone, guest_email, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) return { ok: false, reason: error.message };
  const rows = (data ?? []) as BookingRow[];

  const variantById = new Map<
    string,
    {
      id: string;
      name: string;
      categoryName: string;
      pricePerNight: number;
    }
  >();
  roomCategories.forEach((c) =>
    c.variants.forEach((v) =>
      variantById.set(v.id, {
        id: v.id,
        name: v.name,
        categoryName: c.name,
        pricePerNight: v.pricePerNight,
      })
    )
  );
  const roomById = new Map(individualRooms.map((r) => [r.id, r]));

  const enrich = (row: BookingRow) => {
    const room = roomById.get(row.room_id);
    const variant = room ? variantById.get(room.variantId) : null;
    const nights = nightsBetween(row.check_in, row.check_out);
    const total = variant ? variant.pricePerNight * nights : 0;
    return {
      total,
      nights,
      variantId: room?.variantId ?? null,
      variantName: variant?.name ?? "Unknown room",
      categoryName: variant?.categoryName ?? "",
      roomNumber: room?.roomNumber ?? row.room_id,
    };
  };

  const confirmed = rows.filter((r) => r.status === "confirmed");
  const pendingCount = rows.filter((r) => r.status === "pending").length;

  let confirmedRevenue = 0;
  for (const r of confirmed) confirmedRevenue += enrich(r).total;

  const avgBookingValue =
    confirmed.length > 0 ? confirmedRevenue / confirmed.length : 0;

  /* This month / last month windows over created_at. */
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  let thisMonthRevenue = 0;
  let thisMonthBookings = 0;
  let lastMonthRevenue = 0;
  let lastMonthBookings = 0;

  for (const r of confirmed) {
    const c = new Date(r.created_at);
    const t = enrich(r).total;
    if (c >= thisMonthStart && c < nextMonthStart) {
      thisMonthRevenue += t;
      thisMonthBookings += 1;
    } else if (c >= lastMonthStart && c < thisMonthStart) {
      lastMonthRevenue += t;
      lastMonthBookings += 1;
    }
  }

  /* Last 12 months by created_at. */
  const monthlySeries: DashboardStats["monthlySeries"] = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    let revenue = 0;
    let bookings = 0;
    for (const r of confirmed) {
      const c = new Date(r.created_at);
      if (c >= start && c < end) {
        revenue += enrich(r).total;
        bookings += 1;
      }
    }
    monthlySeries.push({
      month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      label: start.toLocaleDateString("en-IN", { month: "short" }),
      year: start.getFullYear(),
      revenue,
      bookings,
    });
  }

  /* Top variants by revenue. */
  const variantAgg = new Map<
    string,
    {
      variantId: string;
      variantName: string;
      categoryName: string;
      bookings: number;
      revenue: number;
    }
  >();
  for (const r of confirmed) {
    const info = enrich(r);
    if (!info.variantId) continue;
    const cur = variantAgg.get(info.variantId) ?? {
      variantId: info.variantId,
      variantName: info.variantName,
      categoryName: info.categoryName,
      bookings: 0,
      revenue: 0,
    };
    cur.bookings += 1;
    cur.revenue += info.total;
    variantAgg.set(info.variantId, cur);
  }
  const topVariants = [...variantAgg.values()].sort(
    (a, b) => b.revenue - a.revenue
  );

  /* Recent bookings (any status — admin wants visibility of in-flight too). */
  const recentBookings = rows.slice(0, 8).map((r) => {
    const info = enrich(r);
    return {
      id: r.id,
      roomNumber: info.roomNumber,
      variantName: info.variantName,
      categoryName: info.categoryName,
      checkIn: r.check_in,
      checkOut: r.check_out,
      nights: info.nights,
      total: info.total,
      guestName: r.guest_name,
      guestPhone: r.guest_phone,
      guestEmail: r.guest_email,
      status: r.status,
      source: r.source,
      provider: r.provider,
      createdAt: r.created_at,
    };
  });

  return {
    ok: true,
    stats: {
      totals: {
        confirmedRevenue,
        confirmedBookings: confirmed.length,
        avgBookingValue,
        thisMonthRevenue,
        thisMonthBookings,
        lastMonthRevenue,
        lastMonthBookings,
        pendingBookings: pendingCount,
      },
      monthlySeries,
      topVariants,
      recentBookings,
    },
  };
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000));
}
