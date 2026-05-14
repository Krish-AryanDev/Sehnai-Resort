import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { individualRooms, roomCategories } from "@/lib/rooms-data";
import { CalendarGrid, type CalendarBooking, type CalendarRoom } from "./_components/CalendarGrid";

export const dynamic = "force-dynamic";

const DEFAULT_WINDOW_DAYS = 14;
const STEP_DAYS = 7;

type SearchParams = { start?: string };

function todayIso(): string {
  const d = new Date();
  return iso(d);
}
function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseIso(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(s: string, n: number): string {
  const d = parseIso(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  // Clamp the start to a valid ISO date; default to today.
  let start = sp.start && /^\d{4}-\d{2}-\d{2}$/.test(sp.start) ? sp.start : todayIso();
  // Snap to today if start would otherwise be NaN.
  if (Number.isNaN(parseIso(start).getTime())) start = todayIso();

  const endExclusive = addDays(start, DEFAULT_WINDOW_DAYS);
  const prevStart = addDays(start, -STEP_DAYS);
  const nextStart = addDays(start, STEP_DAYS);

  // Order rooms: by category position in roomCategories, then variant order
  // within the category, then room number. Gives a stable "Suite → Deluxe →
  // Standard" grouping that mirrors the public site.
  const variantOrder = new Map<string, number>();
  roomCategories.forEach((c, ci) =>
    c.variants.forEach((v, vi) =>
      variantOrder.set(v.id, ci * 100 + vi)
    )
  );
  const roomsSorted: CalendarRoom[] = [...individualRooms]
    .sort((a, b) => {
      const av = variantOrder.get(a.variantId) ?? 999;
      const bv = variantOrder.get(b.variantId) ?? 999;
      if (av !== bv) return av - bv;
      return a.roomNumber.localeCompare(b.roomNumber);
    })
    .map((r) => {
      const variant = roomCategories
        .flatMap((c) => c.variants.map((v) => ({ ...v, categoryName: c.name })))
        .find((v) => v.id === r.variantId);
      return {
        id: r.id,
        roomNumber: r.roomNumber,
        variantName: variant?.name ?? r.variantId,
        categoryName: variant?.categoryName ?? "",
      };
    });

  // Fetch overlapping bookings in the window. Half-open interval logic:
  // a booking overlaps the window iff check_in < endExclusive AND check_out > start.
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("room_bookings")
    .select("id, room_id, check_in, check_out, status, source, guest_name")
    .in("status", ["pending", "confirmed"])
    .lt("check_in", endExclusive)
    .gt("check_out", start);

  if (error) {
    return (
      <div>
        <h1 className="admin-h1">Calendar</h1>
        <div className="admin-alert admin-alert--error">
          Failed to load bookings: {error.message}
        </div>
      </div>
    );
  }

  const bookings: CalendarBooking[] = (data ?? []).map((b) => ({
    id: b.id as string,
    roomId: b.room_id as string,
    checkIn: b.check_in as string,
    checkOut: b.check_out as string,
    status: b.status as "pending" | "confirmed",
    source: b.source as "admin" | "online",
    guestName: (b.guest_name as string | null) ?? null,
  }));

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="admin-h1" style={{ marginBottom: 0 }}>
          Occupancy calendar
        </h1>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
          <Link
            href={`/admin/calendar?start=${prevStart}`}
            className="admin-button admin-button--secondary"
          >
            ← Earlier
          </Link>
          <Link
            href="/admin/calendar"
            className="admin-button admin-button--secondary"
          >
            Today
          </Link>
          <Link
            href={`/admin/calendar?start=${nextStart}`}
            className="admin-button admin-button--secondary"
          >
            Later →
          </Link>
        </div>
      </div>

      <p style={{ color: "#57534e", marginBottom: "1rem", fontSize: 13 }}>
        Showing {start} → {addDays(endExclusive, -1)} · {bookings.length} booking
        {bookings.length === 1 ? "" : "s"} in this window
      </p>

      <CalendarGrid
        rooms={roomsSorted}
        bookings={bookings}
        start={start}
        days={DEFAULT_WINDOW_DAYS}
      />
    </div>
  );
}
