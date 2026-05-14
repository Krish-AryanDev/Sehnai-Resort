import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { individualRooms, roomCategories } from "@/lib/rooms-data";
import { CancelButton } from "./CancelButton";

export const dynamic = "force-dynamic";

type Status = "pending" | "confirmed" | "failed" | "cancelled";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("room_bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div>
        <h1 className="admin-h1">Booking</h1>
        <div className="admin-alert admin-alert--error">
          Failed to load booking: {error.message}
        </div>
      </div>
    );
  }
  if (!data) notFound();

  const room = individualRooms.find((r) => r.id === data.room_id);
  const variant = room
    ? roomCategories
        .flatMap((c) => c.variants.map((v) => ({ ...v, categoryName: c.name })))
        .find((v) => v.id === room.variantId)
    : null;

  const status = data.status as Status;
  const canCancel = status === "pending" || status === "confirmed";

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="admin-h1" style={{ marginBottom: 0 }}>
          Booking detail
        </h1>
        <Link href="/admin/bookings" className="admin-link">
          ← Back to bookings
        </Link>
      </div>

      <div className="admin-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 className="admin-h2" style={{ marginBottom: 0 }}>
            {room ? `Room ${room.roomNumber}` : data.room_id}
            {variant ? ` · ${variant.name}` : ""}
          </h2>
          <span className={`admin-pill admin-pill--${status}`}>{status}</span>
        </div>

        <dl className="admin-detail-grid">
          <dt>Category</dt>
          <dd>{variant?.categoryName ?? "—"}</dd>
          <dt>Check-in</dt>
          <dd>{data.check_in}</dd>
          <dt>Check-out</dt>
          <dd>{data.check_out}</dd>
          <dt>Source</dt>
          <dd>{data.source}</dd>
          <dt>Guest name</dt>
          <dd>{data.guest_name || "—"}</dd>
          <dt>Phone</dt>
          <dd>{data.guest_phone || "—"}</dd>
          <dt>Email</dt>
          <dd>{data.guest_email || "—"}</dd>
          <dt>Created by</dt>
          <dd>{data.created_by_email || "—"}</dd>
          <dt>Created at</dt>
          <dd>{data.created_at}</dd>
          <dt>ID</dt>
          <dd style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
            {data.id}
          </dd>
        </dl>

        {canCancel ? (
          <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #e7e5e4" }}>
            <p style={{ color: "#57534e", marginBottom: ".75rem" }}>
              Cancelling marks the booking as <code>cancelled</code> and
              frees up these dates on the public site. The row is kept for
              audit; it&apos;s not deleted.
            </p>
            <CancelButton id={data.id} />
          </div>
        ) : (
          <div className="admin-alert admin-alert--info" style={{ marginTop: "1.5rem" }}>
            This booking is in status <strong>{status}</strong>. It already
            doesn&apos;t block any dates on the public site.
          </div>
        )}
      </div>
    </div>
  );
}
