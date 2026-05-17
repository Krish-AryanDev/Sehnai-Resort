import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Clock, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrderWithLines } from "@/lib/order-repo";
import { nextOrderStatus, type OrderStatus } from "@/lib/order-mutations";
import {
  advanceOrderStatusAction,
  markCodPaidAction,
} from "../actions";
import { CancelOrderForm } from "../_components/CancelOrderForm";

export const dynamic = "force-dynamic";

const INR = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Placed",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const FULFILLMENT_LABEL = {
  in_room: "In-room dining",
  takeaway: "Takeaway",
  delivery: "Delivery",
} as const;

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { ok, error } = await searchParams;

  const order = await getOrderWithLines(id);
  if (!order) notFound();

  const next = nextOrderStatus(order.status);
  const cancelled = order.status === "cancelled";
  const delivered = order.status === "delivered";

  return (
    <div>
      <div className="admin-toolbar" style={{ alignItems: "center" }}>
        <Link
          href="/admin/orders"
          style={{
            color: "#57534e",
            fontSize: 13,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={14} /> All orders
        </Link>
        <h1 className="admin-h1" style={{ marginBottom: 0 }}>
          Order {order.shortCode}
        </h1>
      </div>

      {ok && (
        <div className="admin-alert admin-alert--success">
          {ok === "paid"
            ? "Marked as paid."
            : ok === "cancelled"
            ? "Order cancelled."
            : ok.startsWith("status-")
            ? `Status moved to "${STATUS_LABEL[ok.slice("status-".length) as OrderStatus] ?? ok}".`
            : "Saved."}
        </div>
      )}
      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "minmax(0,1fr)",
        }}
      >
        {/* Status + actions */}
        <div className="admin-card">
          <h2 className="admin-h2">Status</h2>
          <div
            style={{
              display: "flex",
              gap: "0.65rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              className={
                "admin-pill " +
                (delivered
                  ? "admin-pill--confirmed"
                  : cancelled
                  ? "admin-pill--cancelled"
                  : "admin-pill--pending")
              }
              style={{ fontSize: 12 }}
            >
              {STATUS_LABEL[order.status]}
            </span>
            <span
              className={
                "admin-pill " +
                (order.paymentStatus === "paid"
                  ? "admin-pill--confirmed"
                  : order.paymentStatus === "failed"
                  ? "admin-pill--failed"
                  : "admin-pill--pending")
              }
              style={{ fontSize: 12 }}
            >
              {order.paymentMode.toUpperCase()} · {order.paymentStatus}
            </span>
            <span style={{ color: "#78716c", fontSize: 12 }}>
              Placed {new Date(order.createdAt).toLocaleString("en-IN")}
            </span>
          </div>

          {cancelled && order.cancelledReason && (
            <p
              style={{
                marginTop: "0.85rem",
                color: "#991b1b",
                fontSize: 13,
                fontStyle: "italic",
              }}
            >
              {order.cancelledReason}
            </p>
          )}

          {!cancelled && (
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              {next && (
                <form action={advanceOrderStatusAction}>
                  <input type="hidden" name="id" value={order.id} />
                  <input
                    type="hidden"
                    name="currentStatus"
                    value={order.status}
                  />
                  <button
                    type="submit"
                    className="admin-button admin-button--primary"
                  >
                    Advance → {STATUS_LABEL[next]}
                  </button>
                </form>
              )}
              {order.paymentMode === "cod" &&
                order.paymentStatus === "pending" && (
                  <form action={markCodPaidAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <button
                      type="submit"
                      className="admin-button admin-button--secondary"
                    >
                      Mark cash collected
                    </button>
                  </form>
                )}
              {!delivered && <CancelOrderForm orderId={order.id} />}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="admin-card">
          <h2 className="admin-h2">Items</h2>
          <table className="admin-table" style={{ marginTop: "0.5rem" }}>
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ width: 100 }}>Variant</th>
                <th style={{ width: 70, textAlign: "right" }}>Qty</th>
                <th style={{ width: 100, textAlign: "right" }}>Unit</th>
                <th style={{ width: 120, textAlign: "right" }}>Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((l) => (
                <tr key={l.id}>
                  <td>{l.nameSnapshot}</td>
                  <td style={{ color: "#78716c", fontSize: 12 }}>
                    {l.variant === "single" ? "—" : l.variant}
                  </td>
                  <td style={{ textAlign: "right" }}>{l.qty}</td>
                  <td
                    style={{
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {INR(l.unitPricePaise)}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: 500,
                    }}
                  >
                    {INR(l.lineTotalPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <SummaryRow label="Subtotal" value={INR(order.subtotalPaise)} />
              {order.deliveryFeePaise > 0 && (
                <SummaryRow
                  label="Delivery"
                  value={INR(order.deliveryFeePaise)}
                />
              )}
              {order.taxPaise > 0 && (
                <SummaryRow label="GST" value={INR(order.taxPaise)} />
              )}
              <SummaryRow
                label="Total"
                value={INR(order.totalPaise)}
                emphasize
              />
            </tfoot>
          </table>
        </div>

        {/* Customer + fulfillment */}
        <div className="admin-card">
          <h2 className="admin-h2">Customer &amp; fulfillment</h2>
          <div
            style={{
              display: "grid",
              gap: "0.85rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              marginTop: "0.5rem",
            }}
          >
            <DetailBlock
              icon={<Phone size={14} />}
              label="Contact"
              primary={order.customerName}
              secondary={order.customerPhone}
              extra={order.customerEmail ?? undefined}
            />
            <DetailBlock
              icon={<Clock size={14} />}
              label="Mode"
              primary={FULFILLMENT_LABEL[order.fulfillment]}
              secondary={
                order.fulfillment === "in_room"
                  ? `Room ${order.roomNumber ?? "?"}`
                  : order.fulfillment === "takeaway"
                  ? order.pickupTime
                    ? `Pickup ${new Date(order.pickupTime).toLocaleString("en-IN")}`
                    : "Pickup ASAP"
                  : "On-premise delivery"
              }
            />
            {order.fulfillment === "delivery" && (
              <DetailBlock
                icon={<MapPin size={14} />}
                label="Address"
                primary={order.addressLine ?? "—"}
                secondary={[
                  order.addressLandmark,
                  order.addressPincode ? `PIN ${order.addressPincode}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || undefined}
                extra={
                  order.deliveryLat != null && order.deliveryLng != null
                    ? `Coords: ${order.deliveryLat.toFixed(5)}, ${order.deliveryLng.toFixed(5)}`
                    : undefined
                }
                action={
                  order.deliveryLat != null && order.deliveryLng != null
                    ? {
                        href: `https://maps.google.com/?q=${order.deliveryLat},${order.deliveryLng}`,
                        label: "Open in Maps",
                      }
                    : undefined
                }
              />
            )}
          </div>
          {order.notes && (
            <p
              style={{
                marginTop: "0.85rem",
                padding: "0.65rem 0.85rem",
                backgroundColor: "#fef3c7",
                color: "#854d0e",
                fontSize: 13,
              }}
            >
              <strong>Notes:</strong> {order.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <tr>
      <td
        colSpan={4}
        style={{
          textAlign: "right",
          color: emphasize ? "#1c1917" : "#57534e",
          fontWeight: emphasize ? 600 : 400,
          paddingTop: emphasize ? "0.65rem" : undefined,
          borderTop: emphasize ? "1px solid #e7e5e4" : undefined,
        }}
      >
        {label}
      </td>
      <td
        style={{
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          fontWeight: emphasize ? 700 : 500,
          color: emphasize ? "#1c1917" : "#1c1917",
          paddingTop: emphasize ? "0.65rem" : undefined,
          borderTop: emphasize ? "1px solid #e7e5e4" : undefined,
        }}
      >
        {value}
      </td>
    </tr>
  );
}

function DetailBlock({
  icon,
  label,
  primary,
  secondary,
  extra,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  primary: string;
  secondary?: string;
  extra?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "#78716c",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {icon}
        {label}
      </div>
      <div style={{ color: "#1c1917", fontWeight: 500 }}>{primary}</div>
      {secondary && (
        <div style={{ color: "#57534e", fontSize: 13 }}>{secondary}</div>
      )}
      {extra && (
        <div style={{ color: "#78716c", fontSize: 12, marginTop: 2 }}>{extra}</div>
      )}
      {action && (
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-link"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 12 }}
        >
          {action.label} <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}
