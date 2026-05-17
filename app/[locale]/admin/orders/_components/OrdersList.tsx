"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type {
  Fulfillment,
  OrderStatus,
  PaymentMode,
  PaymentStatus,
} from "@/lib/order-mutations";

export type AdminOrderRow = {
  id: string;
  shortCode: string;
  fulfillment: Fulfillment;
  status: OrderStatus;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  customerName: string;
  customerPhone: string;
  roomNumber: string | null;
  totalPaise: number;
  createdAt: string;
};

type StatusFilter = "all" | "active" | OrderStatus;
type FulfillmentFilter = "all" | Fulfillment;

const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Placed",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const FULFILLMENT_LABEL: Record<Fulfillment, string> = {
  in_room: "In-room",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

const ACTIVE_STATUSES: OrderStatus[] = [
  "placed",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
];

const STATUS_VALUES: StatusFilter[] = [
  "all",
  "active",
  "placed",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

function isStatusFilter(v: string | null): v is StatusFilter {
  return v != null && (STATUS_VALUES as string[]).includes(v);
}

const INR = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrdersList({ rows }: { rows: AdminOrderRow[] }) {
  // Seed the status filter from ?status= when present so deep links from
  // the Restaurant dashboard's kitchen pulse land on the right view.
  const searchParams = useSearchParams();
  const initialStatus: StatusFilter = (() => {
    const v = searchParams?.get("status") ?? null;
    return isStatusFilter(v) ? v : "active";
  })();

  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [fulfillment, setFulfillment] = useState<FulfillmentFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (status === "active" && !ACTIVE_STATUSES.includes(r.status))
        return false;
      if (status !== "all" && status !== "active" && r.status !== status)
        return false;
      if (fulfillment !== "all" && r.fulfillment !== fulfillment) return false;
      if (q) {
        const hay = `${r.shortCode} ${r.customerName} ${r.customerPhone} ${
          r.roomNumber ?? ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, status, fulfillment, search]);

  return (
    <div className="admin-card">
      <div className="admin-filters" style={{ marginBottom: "1rem" }}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
        >
          <option value="active">Active orders</option>
          <option value="all">All statuses</option>
          <option value="placed">Placed</option>
          <option value="accepted">Accepted</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="out_for_delivery">Out for delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={fulfillment}
          onChange={(e) =>
            setFulfillment(e.target.value as FulfillmentFilter)
          }
        >
          <option value="all">All modes</option>
          <option value="in_room">In-room</option>
          <option value="takeaway">Takeaway</option>
          <option value="delivery">Delivery</option>
        </select>
        <input
          type="search"
          placeholder="Search code, name, phone, room…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <span style={{ color: "#57534e", fontSize: 12, marginLeft: "auto" }}>
          {filtered.length} shown
        </span>
      </div>

      {filtered.length === 0 ? (
        <p style={{ padding: "1.5rem", color: "#78716c", textAlign: "center" }}>
          No orders match your filters.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Customer</th>
              <th>Mode</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Placed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td style={{ fontFamily: "monospace", fontWeight: 600 }}>
                  {r.shortCode}
                </td>
                <td>
                  <div style={{ fontWeight: 500, color: "#1c1917" }}>
                    {r.customerName}
                  </div>
                  <div style={{ fontSize: 11, color: "#78716c" }}>
                    {r.customerPhone}
                    {r.roomNumber && ` · Room ${r.roomNumber}`}
                  </div>
                </td>
                <td>{FULFILLMENT_LABEL[r.fulfillment]}</td>
                <td
                  style={{
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 500,
                  }}
                >
                  {INR(r.totalPaise)}
                </td>
                <td>
                  <StatusPill status={r.status} />
                </td>
                <td>
                  <span
                    className={
                      "admin-pill " +
                      (r.paymentStatus === "paid"
                        ? "admin-pill--confirmed"
                        : r.paymentStatus === "failed"
                        ? "admin-pill--failed"
                        : "admin-pill--pending")
                    }
                  >
                    {r.paymentMode.toUpperCase()} · {r.paymentStatus}
                  </span>
                </td>
                <td style={{ color: "#78716c", fontSize: 12 }}>
                  {fmtTime(r.createdAt)}
                </td>
                <td>
                  <Link
                    href={`/admin/orders/${r.id}`}
                    className="admin-link"
                  >
                    Open
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

function StatusPill({ status }: { status: OrderStatus }) {
  const className =
    status === "delivered"
      ? "admin-pill admin-pill--confirmed"
      : status === "cancelled"
      ? "admin-pill admin-pill--cancelled"
      : "admin-pill admin-pill--pending";
  return <span className={className}>{STATUS_LABEL[status]}</span>;
}
