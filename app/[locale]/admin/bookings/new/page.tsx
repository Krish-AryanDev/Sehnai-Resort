import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { individualRooms, roomCategories } from "@/lib/rooms-data";
import { NewBookingForm, type RoomOption } from "./NewBookingForm";

export const dynamic = "force-dynamic";

/** Manual block entry. Used for offline bookings, maintenance holds,
 *  owner stays — anything that should make a room unavailable on the public
 *  site without going through the (future) Razorpay flow. */
export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; roomId?: string }>;
}) {
  await requireAdmin();

  const sp = await searchParams;

  // Build a flat dropdown list: "Room 010 · Standard AC · Standard Room"
  const rooms: RoomOption[] = individualRooms
    .map((r) => {
      const variant = roomCategories
        .flatMap((c) => c.variants.map((v) => ({ ...v, categoryName: c.name })))
        .find((v) => v.id === r.variantId);
      return {
        id: r.id,
        label: `Room ${r.roomNumber} — ${variant?.name ?? r.variantId}` +
          (variant ? ` (${variant.categoryName})` : ""),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="admin-h1" style={{ marginBottom: 0 }}>
          New manual block
        </h1>
        <Link href="/admin/bookings" className="admin-link">
          ← Back to bookings
        </Link>
      </div>

      <div className="admin-card" style={{ maxWidth: 640 }}>
        {sp.error && (
          <div className="admin-alert admin-alert--error">
            {decodeURIComponent(sp.error)}
          </div>
        )}
        <NewBookingForm rooms={rooms} defaultRoomId={sp.roomId ?? rooms[0]?.id} />
      </div>
    </div>
  );
}
