import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { individualRooms, roomCategories } from "@/lib/rooms-data";
import { BookingsList, type AdminBookingRow } from "./_components/BookingsList";

export const dynamic = "force-dynamic";

/** All bookings, newest-first. Filters live in the client component for
 *  instant interactivity — the fetch returns the full set. With a 12-room
 *  hotel this stays small enough that pagination isn't worth the complexity. */
export default async function AdminBookingsPage() {
  await requireAdmin();

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("room_bookings")
    .select(
      "id, room_id, check_in, check_out, source, status, guest_name, guest_phone, created_by_email, created_at"
    )
    .order("check_in", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div>
        <h1 className="admin-h1">Bookings</h1>
        <div className="admin-alert admin-alert--error">
          Failed to load bookings: {error.message}
        </div>
      </div>
    );
  }

  const rows: AdminBookingRow[] = (data ?? []).map((r) => {
    const room = individualRooms.find((rm) => rm.id === r.room_id);
    const variant = room
      ? roomCategories
          .flatMap((c) => c.variants.map((v) => ({ ...v, categoryName: c.name })))
          .find((v) => v.id === room.variantId)
      : null;
    return {
      id: r.id,
      roomId: r.room_id,
      roomNumber: room?.roomNumber ?? r.room_id,
      variantName: variant?.name ?? "—",
      categoryName: variant?.categoryName ?? "—",
      checkIn: r.check_in,
      checkOut: r.check_out,
      source: r.source,
      status: r.status,
      guestName: r.guest_name,
      guestPhone: r.guest_phone,
      createdByEmail: r.created_by_email,
      createdAt: r.created_at,
    };
  });

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="admin-h1" style={{ marginBottom: 0 }}>
          Bookings
        </h1>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <Link href="/admin/calendar" className="admin-button admin-button--secondary">
            View calendar
          </Link>
          <Link href="/admin/bookings/new" className="admin-button admin-button--primary">
            + New block
          </Link>
        </div>
      </div>
      <BookingsList rows={rows} />
    </div>
  );
}
