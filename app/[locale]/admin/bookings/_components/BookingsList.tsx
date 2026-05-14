"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type AdminBookingRow = {
  id: string;
  roomId: string;
  roomNumber: string;
  variantName: string;
  categoryName: string;
  checkIn: string;
  checkOut: string;
  source: "admin" | "online";
  status: "pending" | "confirmed" | "failed" | "cancelled";
  guestName: string | null;
  guestPhone: string | null;
  createdByEmail: string | null;
  createdAt: string;
};

type Bucket = "all" | "upcoming" | "past";
type StatusFilter = "all" | "pending" | "confirmed" | "failed" | "cancelled";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function BookingsList({ rows }: { rows: AdminBookingRow[] }) {
  const [bucket, setBucket] = useState<Bucket>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [roomId, setRoomId] = useState<string>("all");

  const roomOptions = useMemo(() => {
    const seen = new Map<string, string>();
    rows.forEach((r) => {
      if (!seen.has(r.roomId)) {
        seen.set(r.roomId, `${r.roomNumber} · ${r.variantName}`);
      }
    });
    return Array.from(seen.entries()).sort((a, b) =>
      a[1].localeCompare(b[1])
    );
  }, [rows]);

  const filtered = useMemo(() => {
    const today = todayIso();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (roomId !== "all" && r.roomId !== roomId) return false;
      if (bucket === "upcoming" && r.checkOut < today) return false;
      if (bucket === "past" && r.checkOut >= today) return false;
      return true;
    });
  }, [rows, bucket, status, roomId]);

  return (
    <div className="admin-card">
      <div className="admin-filters" style={{ marginBottom: "1rem" }}>
        <select value={bucket} onChange={(e) => setBucket(e.target.value as Bucket)}>
          <option value="all">All dates</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="failed">Failed</option>
        </select>
        <select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
          <option value="all">All rooms</option>
          {roomOptions.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <span style={{ color: "#57534e", fontSize: 12, marginLeft: "auto" }}>
          {filtered.length} of {rows.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "#57534e" }}>No bookings match these filters.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Dates</th>
              <th>Status</th>
              <th>Source</th>
              <th>Guest</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{r.roomNumber}</div>
                  <div style={{ color: "#78716c", fontSize: 12 }}>
                    {r.variantName}
                  </div>
                </td>
                <td>
                  <div>{formatRange(r.checkIn, r.checkOut)}</div>
                  <div style={{ color: "#78716c", fontSize: 12 }}>
                    {nights(r.checkIn, r.checkOut)} night
                    {nights(r.checkIn, r.checkOut) === 1 ? "" : "s"}
                  </div>
                </td>
                <td>
                  <span className={`admin-pill admin-pill--${r.status}`}>
                    {r.status}
                  </span>
                </td>
                <td style={{ color: "#57534e" }}>{r.source}</td>
                <td>
                  {r.guestName || r.guestPhone ? (
                    <>
                      <div>{r.guestName ?? "—"}</div>
                      {r.guestPhone && (
                        <div style={{ color: "#78716c", fontSize: 12 }}>
                          {r.guestPhone}
                        </div>
                      )}
                    </>
                  ) : (
                    <span style={{ color: "#a8a29e" }}>—</span>
                  )}
                </td>
                <td>
                  <Link href={`/admin/bookings/${r.id}`} className="admin-link">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function formatRange(ci: string, co: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  return `${new Date(ci).toLocaleDateString("en-IN", opts)} → ${new Date(co).toLocaleDateString(
    "en-IN",
    opts
  )}`;
}

function nights(ci: string, co: string): number {
  const a = new Date(ci).getTime();
  const b = new Date(co).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000));
}
