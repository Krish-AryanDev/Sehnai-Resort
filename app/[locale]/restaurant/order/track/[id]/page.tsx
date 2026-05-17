import { notFound } from "next/navigation";
import { ArrowLeft, Check, Circle, Clock, MapPin, Phone, ShoppingBag } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getOrderWithLines, type OrderWithLines } from "@/lib/order-repo";
import type { Fulfillment, OrderStatus } from "@/lib/order-mutations";

export const dynamic = "force-dynamic";

const INR = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const FULFILLMENT_LABEL: Record<Fulfillment, string> = {
  in_room: "In-room dining",
  takeaway: "Takeaway",
  delivery: "Home delivery",
};

/** Status timeline shown to the customer. Branches per fulfillment so the
 *  delivery step is hidden for takeaway / in-room. */
function stepsFor(f: Fulfillment): { key: OrderStatus; label: string }[] {
  const base: { key: OrderStatus; label: string }[] = [
    { key: "placed", label: "Order placed" },
    { key: "accepted", label: "Accepted by kitchen" },
    { key: "preparing", label: "Preparing" },
    { key: "ready", label: f === "takeaway" ? "Ready for pickup" : "Ready" },
  ];
  if (f === "delivery") {
    base.push({ key: "out_for_delivery", label: "Out for delivery" });
    base.push({ key: "delivered", label: "Delivered" });
  } else if (f === "in_room") {
    base.push({ key: "delivered", label: "Delivered to room" });
  } else {
    base.push({ key: "delivered", label: "Collected" });
  }
  return base;
}

const STATUS_ORDER: OrderStatus[] = [
  "placed",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
];

function statusIndex(s: OrderStatus): number {
  const i = STATUS_ORDER.indexOf(s);
  return i === -1 ? 0 : i;
}

export default async function OrderTrackPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const order = await getOrderWithLines(id);
  if (!order) notFound();

  return <TrackingView order={order} />;
}

function TrackingView({ order }: { order: OrderWithLines }) {
  const cancelled = order.status === "cancelled";
  const steps = stepsFor(order.fulfillment);
  const currentIdx = statusIndex(order.status);

  return (
    <div style={{ backgroundColor: "#07070d", color: "#fff", minHeight: "100vh" }}>
      {/* Header */}
      <section
        style={{
          backgroundColor: "#0d0d16",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "6rem",
          paddingBottom: "1.5rem",
        }}
      >
        <div className="max-w-3xl mx-auto" style={{ padding: "0 1.25rem" }}>
          <Link href="/restaurant/order" className="inline-flex items-center gap-2 group" style={backLinkStyle}>
            <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform duration-300" />
            Back to menu
          </Link>
          <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={eyebrowStyle}>{cancelled ? "Order cancelled" : "Order confirmed"}</span>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#fff",
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                fontWeight: 400,
                margin: 0,
              }}
            >
              Receipt {order.shortCode}
            </h1>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                color: "rgba(255,255,255,0.5)",
                fontSize: "1rem",
              }}
            >
              {FULFILLMENT_LABEL[order.fulfillment]} ·{" "}
              {order.paymentMode === "cod" ? "Pay on delivery / pickup" : "Online payment"}
            </p>
          </div>
        </div>
      </section>

      <div
        className="max-w-3xl mx-auto"
        style={{
          padding: "1.5rem 1.25rem 5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {cancelled && (
          <div
            style={{
              padding: "0.85rem 1rem",
              backgroundColor: "rgba(229,115,109,0.12)",
              border: "1px solid rgba(229,115,109,0.4)",
              color: "#F5B5B0",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.85rem",
            }}
          >
            {order.cancelledReason ?? "This order has been cancelled."}
          </div>
        )}

        {/* Status timeline */}
        {!cancelled && (
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Order status</h2>
            <ol style={{ listStyle: "none", padding: 0, margin: "1rem 0 0" }}>
              {steps.map((step, i) => {
                const done = statusIndex(step.key) <= currentIdx;
                const current = step.key === order.status;
                return (
                  <li
                    key={step.key}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      paddingBottom: i === steps.length - 1 ? 0 : "0.95rem",
                      position: "relative",
                    }}
                  >
                    {i !== steps.length - 1 && (
                      <span
                        aria-hidden
                        style={{
                          position: "absolute",
                          left: 11,
                          top: 22,
                          bottom: -6,
                          width: 2,
                          backgroundColor: done
                            ? "#C9A84C"
                            : "rgba(255,255,255,0.08)",
                        }}
                      />
                    )}
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: done ? "#C9A84C" : "transparent",
                        border: `2px solid ${done ? "#C9A84C" : "rgba(255,255,255,0.2)"}`,
                        color: "#000",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        zIndex: 1,
                      }}
                    >
                      {done ? <Check size={13} strokeWidth={3} /> : <Circle size={9} />}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.92rem",
                        color: done ? "#fff" : "rgba(255,255,255,0.45)",
                        fontWeight: current ? 700 : 500,
                        paddingTop: 3,
                      }}
                    >
                      {step.label}
                      {current && (
                        <span
                          style={{
                            display: "block",
                            fontFamily: "'Cormorant Garamond', serif",
                            fontStyle: "italic",
                            color: "rgba(255,255,255,0.5)",
                            fontWeight: 400,
                            fontSize: "0.88rem",
                            marginTop: 2,
                          }}
                        >
                          In progress now.
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>

            <p
              style={{
                marginTop: "1.1rem",
                padding: "0.6rem 0.75rem",
                backgroundColor: "rgba(201,168,76,0.06)",
                border: "1px solid rgba(201,168,76,0.18)",
                color: "rgba(255,255,255,0.7)",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.78rem",
                lineHeight: 1.45,
              }}
            >
              <strong style={{ color: "#C9A84C" }}>Tip:</strong> refresh this page
              to see the latest status. Live updates land in the next phase.
            </p>
          </section>
        )}

        {/* Receipt */}
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Receipt</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: "0.75rem 0 0" }}>
            {order.lines.map((l) => (
              <li
                key={l.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "0.5rem 0",
                  borderBottom: "1px dashed rgba(255,255,255,0.07)",
                }}
              >
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.88rem" }}>
                  <strong style={{ color: "#C9A84C", marginRight: 6 }}>{l.qty}×</strong>
                  {l.nameSnapshot}
                  {l.variant !== "single" && (
                    <span style={{ color: "rgba(255,255,255,0.5)", marginLeft: 6 }}>
                      ({l.variant})
                    </span>
                  )}
                </span>
                <span
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "0.92rem",
                    color: "#fff",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {INR(l.lineTotalPaise)}
                </span>
              </li>
            ))}
          </ul>

          <ReceiptRow label="Subtotal" value={INR(order.subtotalPaise)} />
          {order.deliveryFeePaise > 0 && (
            <ReceiptRow label="Delivery" value={INR(order.deliveryFeePaise)} />
          )}
          {order.taxPaise > 0 && <ReceiptRow label="GST" value={INR(order.taxPaise)} />}
          <ReceiptRow label="Total" value={INR(order.totalPaise)} emphasize />

          <div
            style={{
              marginTop: "0.85rem",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.55)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ShoppingBag size={13} style={{ color: "#C9A84C" }} />
            {order.paymentMode === "cod"
              ? `Payment ${order.paymentStatus === "paid" ? "received" : "pending"} — pay on ${
                  order.fulfillment === "delivery" ? "delivery" : "pickup"
                }.`
              : `Payment ${order.paymentStatus}.`}
          </div>
        </section>

        {/* Fulfillment details */}
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Where it&apos;s going</h2>
          <div
            style={{
              marginTop: "0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.88rem",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {order.fulfillment === "in_room" && (
              <Detail icon={<MapPin size={14} />} label="Room">
                {order.roomNumber}
              </Detail>
            )}
            {order.fulfillment === "delivery" && (
              <>
                <Detail icon={<MapPin size={14} />} label="Address">
                  {order.addressLine}
                  {order.addressLandmark && (
                    <span style={{ color: "rgba(255,255,255,0.55)" }}>
                      {" "}
                      · {order.addressLandmark}
                    </span>
                  )}
                  {order.addressPincode && (
                    <span style={{ color: "rgba(255,255,255,0.55)" }}>
                      {" "}
                      · PIN {order.addressPincode}
                    </span>
                  )}
                </Detail>
              </>
            )}
            {order.fulfillment === "takeaway" && (
              <Detail icon={<Clock size={14} />} label="Pickup">
                {order.pickupTime
                  ? new Date(order.pickupTime).toLocaleString("en-IN")
                  : "ASAP"}
              </Detail>
            )}
            <Detail icon={<Phone size={14} />} label="Contact">
              {order.customerName} · {order.customerPhone}
            </Detail>
            {order.notes && (
              <Detail icon={<Check size={14} />} label="Notes">
                {order.notes}
              </Detail>
            )}
          </div>
        </section>

        <p
          style={{
            textAlign: "center",
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            color: "rgba(255,255,255,0.4)",
            fontSize: "0.95rem",
            marginTop: "0.5rem",
          }}
        >
          Bookmark this page — it&apos;s your link to your order&apos;s status.
        </p>
      </div>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
        padding: "0.45rem 0",
        borderTop: emphasize ? "1px solid rgba(255,255,255,0.1)" : undefined,
        marginTop: emphasize ? "0.5rem" : 0,
      }}
    >
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: emphasize ? "0.78rem" : "0.74rem",
          letterSpacing: emphasize ? "0.22em" : "0.16em",
          textTransform: "uppercase",
          color: emphasize ? "#C9A84C" : "rgba(255,255,255,0.5)",
          fontWeight: emphasize ? 700 : 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: emphasize ? "1.3rem" : "0.95rem",
          fontWeight: emphasize ? 600 : 500,
          color: "#fff",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ color: "#C9A84C", paddingTop: 2 }}>{icon}</span>
      <div>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.62rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
            fontWeight: 600,
          }}
        >
          {label}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

const backLinkStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "0.7rem",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.45)",
  fontWeight: 500,
};
const eyebrowStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "0.68rem",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: "#C9A84C",
  fontWeight: 600,
};
const cardStyle: React.CSSProperties = {
  backgroundColor: "#0d0d16",
  border: "1px solid rgba(255,255,255,0.05)",
  padding: "1.15rem",
};
const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  color: "#fff",
  fontSize: "1.05rem",
  fontWeight: 500,
  margin: 0,
};
