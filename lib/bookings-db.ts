import "server-only";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase-server";
import {
  type RoomBooking,
  getRoomsForCategory,
} from "@/lib/rooms-data";

let warnedAboutMissingEnv = false;
function warnOnceMissingEnv() {
  if (warnedAboutMissingEnv) return;
  warnedAboutMissingEnv = true;
  // eslint-disable-next-line no-console
  console.warn(
    "[bookings-db] Supabase env not set — returning empty bookings list. " +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in " +
      ".env.local to enable real availability."
  );
}

let warnedAboutDbError = false;
function warnOnceDbError(where: string, message: string) {
  // Always log once so misconfig is visible, even in prod logs. The site
  // degrades to "no known blocks" instead of 500ing the public page.
  if (warnedAboutDbError) return;
  warnedAboutDbError = true;
  // eslint-disable-next-line no-console
  console.warn(
    `[bookings-db] ${where} failed (${message}) — falling back to empty ` +
      "bookings list. Verify the room_bookings table exists, RLS is set " +
      "per db/migrations/0001_room_bookings.sql, and the anon key is valid."
  );
}

type DbRow = {
  id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  source: "admin" | "online";
  status: "pending" | "confirmed" | "failed" | "cancelled";
};

function rowToBooking(r: DbRow): RoomBooking {
  return {
    id: r.id,
    roomId: r.room_id,
    checkIn: r.check_in,
    checkOut: r.check_out,
    source: r.source,
  };
}

/** Bookings the public availability math needs to know about: anything
 *  pending or confirmed whose checkout is today or later. Cancelled/failed
 *  rows are filtered out by RLS, but we belt-and-brace the status filter. */
export async function getActiveBookings(): Promise<RoomBooking[]> {
  if (!isSupabaseConfigured()) {
    warnOnceMissingEnv();
    return [];
  }
  const supabase = getSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("room_bookings")
    .select("id, room_id, check_in, check_out, source, status")
    .in("status", ["pending", "confirmed"])
    .gte("check_out", today);

  if (error) {
    warnOnceDbError("getActiveBookings", error.message);
    return [];
  }
  return (data as DbRow[]).map(rowToBooking);
}

/** Same shape as getActiveBookings but narrowed to one category's room ids —
 *  saves payload size for the detail page. */
export async function getBookingsForCategory(
  categoryId: string
): Promise<RoomBooking[]> {
  if (!isSupabaseConfigured()) {
    warnOnceMissingEnv();
    return [];
  }
  const roomIds = getRoomsForCategory(categoryId).map((r) => r.id);
  if (roomIds.length === 0) return [];

  const supabase = getSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("room_bookings")
    .select("id, room_id, check_in, check_out, source, status")
    .in("status", ["pending", "confirmed"])
    .in("room_id", roomIds)
    .gte("check_out", today);

  if (error) {
    warnOnceDbError(`getBookingsForCategory(${categoryId})`, error.message);
    return [];
  }
  return (data as DbRow[]).map(rowToBooking);
}
