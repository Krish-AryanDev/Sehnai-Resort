"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, Building2, Bike, ShoppingBag, MapPin, CircleCheck, CircleAlert, Loader2, CreditCard, Wallet } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useCart } from "@/lib/cart-store";
import { haversineKm } from "@/lib/delivery-distance";
import type { Fulfillment } from "@/lib/order-mutations";
import type { FoodPaymentOrder } from "@/lib/payment-provider";
import { DemoPaymentModal } from "@/components/DemoPaymentModal";
import { placeCodOrder } from "../_actions/place-order";
import {
  createOnlinePaymentOrder,
  confirmOnlinePayment,
  failOnlinePayment,
  cancelOnlinePayment,
} from "../_actions/online-payment";

type PaymentMode = "online" | "cod";

type CheckoutSettings = {
  deliveryEnabled: boolean;
  deliveryRadiusKm: number;
  deliveryFeePaise: number;
  restaurantLat: number | null;
  restaurantLng: number | null;
  gstPercent: number;
};

const INR = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

type GeoState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "denied"; message: string }
  | {
      kind: "ok";
      lat: number;
      lng: number;
      distanceKm: number | null;
    };

export function CheckoutClient({ settings }: { settings: CheckoutSettings }) {
  const cart = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fulfillment, setFulfillment] = useState<Fulfillment>(
    settings.deliveryEnabled ? "in_room" : "in_room"
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("online");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [addressLandmark, setAddressLandmark] = useState("");
  const [addressPincode, setAddressPincode] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");
  const [geo, setGeo] = useState<GeoState>({ kind: "idle" });

  /** Holds the FoodPaymentOrder once the user submits the online flow.
   *  Null when no payment is in progress. Drives the <DemoPaymentModal />. */
  const [paymentOrder, setPaymentOrder] = useState<FoodPaymentOrder | null>(null);

  // ---- Derived totals (display only — server is authoritative) ----
  const subtotalPaise = cart.totalPaise;
  const deliveryFeePaise =
    fulfillment === "delivery" ? settings.deliveryFeePaise : 0;
  const taxPaise =
    settings.gstPercent > 0
      ? Math.round((subtotalPaise * settings.gstPercent) / 100)
      : 0;
  const totalPaise = subtotalPaise + deliveryFeePaise + taxPaise;

  const groupedItems = useMemo(() => {
    return cart.items.map((it) => ({
      key: `${it.menuItemId}::${it.variant}`,
      label:
        it.name +
        (it.variant === "single"
          ? ""
          : it.variant === "half"
          ? " (Half)"
          : " (Full)"),
      qty: it.qty,
      lineTotal: it.unitPricePaise * it.qty,
    }));
  }, [cart.items]);

  function requestLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeo({
        kind: "denied",
        message: "Your browser doesn't support location access.",
      });
      return;
    }
    setGeo({ kind: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const distanceKm =
          settings.restaurantLat != null && settings.restaurantLng != null
            ? haversineKm(
                { lat, lng },
                {
                  lat: settings.restaurantLat,
                  lng: settings.restaurantLng,
                }
              )
            : null;
        setGeo({ kind: "ok", lat, lng, distanceKm });
      },
      (err) => {
        setGeo({
          kind: "denied",
          message:
            err.code === err.PERMISSION_DENIED
              ? "Location permission denied. You can still type your address — our staff will sort the rest out."
              : "Couldn't get your location. Type your address instead.",
        });
      },
      { enableHighAccuracy: true, timeout: 8_000 }
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const deliveryLat = geo.kind === "ok" ? geo.lat : null;
    const deliveryLng = geo.kind === "ok" ? geo.lng : null;

    const sharedInput = {
      fulfillment,
      customerName,
      customerPhone,
      customerEmail: customerEmail.trim() ? customerEmail : null,
      roomNumber: fulfillment === "in_room" ? roomNumber : null,
      addressLine: fulfillment === "delivery" ? addressLine : null,
      addressLandmark: fulfillment === "delivery" ? addressLandmark : null,
      addressPincode: fulfillment === "delivery" ? addressPincode : null,
      deliveryLat: fulfillment === "delivery" ? deliveryLat : null,
      deliveryLng: fulfillment === "delivery" ? deliveryLng : null,
      pickupTime: fulfillment === "takeaway" && pickupTime ? pickupTime : null,
      notes: notes.trim() ? notes : null,
      cart: cart.items.map((it) => ({
        menuItemId: it.menuItemId,
        variant: it.variant,
        qty: it.qty,
      })),
    };

    startTransition(async () => {
      if (paymentMode === "cod") {
        const result = await placeCodOrder(sharedInput);
        if (!result.ok) {
          setError(result.reason);
          return;
        }
        // Wipe the cart before navigating so the storefront doesn't
        // re-show items the customer just placed.
        cart.clear();
        router.push(`/restaurant/order/track/${result.orderId}`);
        return;
      }

      // Online: mint the provider order and open the demo modal. The order
      // exists in the DB as 'placed' with payment_status='pending' from
      // this point — confirmOnlinePayment flips it to 'paid' once the user
      // pays inside the modal. Dismiss / failure cancels it.
      const result = await createOnlinePaymentOrder(sharedInput);
      if (!result.ok) {
        setError(result.reason);
        return;
      }
      setPaymentOrder(result.order);
    });
  }

  /** Modal "Pay" succeeded. Clear cart and route to the customer tracking
   *  page — the order is now paid + placed. */
  const handlePaymentSuccess = () => {
    if (!paymentOrder) return;
    const foodOrderId = paymentOrder.foodOrderId;
    setPaymentOrder(null);
    cart.clear();
    router.push(`/restaurant/order/track/${foodOrderId}`);
  };

  /** Modal hit a server-side failure. We leave the modal open on its error
   *  screen so the user can read the reason and close; cancelOnlinePayment
   *  has already been called by failOnlinePayment under the hood. */
  const handlePaymentFailure = (_reason: string, _orderId: string) => {
    // No-op — modal handles the error screen itself.
  };

  /** User closed the modal without paying. Cancel the pending order so it
   *  doesn't sit forever, then re-open the checkout form (cart still has
   *  the items — they can retry or switch to COD). */
  const handlePaymentDismiss = async (orderId: string) => {
    setPaymentOrder(null);
    await cancelOnlinePayment(orderId);
  };

  // ---- Hydration / empty cart guard ----
  if (!cart.hydrated) {
    return (
      <div style={pageStyle}>
        <div style={{ padding: "8rem 1rem", textAlign: "center", color: "rgba(255,255,255,0.45)" }}>
          Loading checkout…
        </div>
      </div>
    );
  }
  if (cart.items.length === 0) {
    return (
      <div style={pageStyle}>
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: "8rem 1.25rem 4rem",
            textAlign: "center",
          }}
        >
          <h1 style={h1Style}>Your cart is empty</h1>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              color: "rgba(255,255,255,0.5)",
              fontSize: "1.1rem",
              marginTop: "0.6rem",
              marginBottom: "1.6rem",
            }}
          >
            Browse the menu and tap <strong style={{ color: "#C9A84C" }}>+ Add</strong> on
            any dish to start an order.
          </p>
          <Link
            href="/restaurant/order"
            style={{
              display: "inline-block",
              padding: "0.85rem 1.6rem",
              backgroundColor: "#C9A84C",
              color: "#000",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.72rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Browse the menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <section
        style={{
          backgroundColor: "#0d0d16",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "6rem",
          paddingBottom: "1.5rem",
        }}
      >
        <div className="max-w-5xl mx-auto" style={{ padding: "0 1.25rem" }}>
          <Link
            href="/restaurant/order"
            className="inline-flex items-center gap-2 group"
            style={backLinkStyle}
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform duration-300" />
            Back to menu
          </Link>
          <div style={{ marginTop: "1.25rem" }}>
            <div style={eyebrowRowStyle}>
              <div className="h-px" style={{ width: 24, backgroundColor: "#C9A84C" }} />
              <span style={eyebrowStyle}>Checkout</span>
            </div>
            <h1 style={h1Style}>Almost there</h1>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                color: "rgba(255,255,255,0.45)",
                fontSize: "1.05rem",
                marginTop: "0.4rem",
              }}
            >
              Pay online, or pay when your order arrives.
            </p>
          </div>
        </div>
      </section>

      <form onSubmit={onSubmit} style={{ padding: "1.5rem 1.25rem 8rem" }}>
        <div
          className="max-w-5xl mx-auto"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr)",
            gap: "1.25rem",
          }}
        >
          <div className="md:grid md:grid-cols-[1fr_360px] md:gap-6">
            {/* ===================== LEFT: form ===================== */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Fulfillment picker */}
              <section style={cardStyle}>
                <h2 style={sectionTitleStyle}>How would you like it?</h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: settings.deliveryEnabled
                      ? "repeat(3, 1fr)"
                      : "repeat(2, 1fr)",
                    gap: 8,
                    marginTop: "0.8rem",
                  }}
                >
                  <FulfillmentTile
                    active={fulfillment === "in_room"}
                    onClick={() => setFulfillment("in_room")}
                    icon={<Building2 size={18} />}
                    label="In-room"
                    sub="Hotel guests"
                  />
                  <FulfillmentTile
                    active={fulfillment === "takeaway"}
                    onClick={() => setFulfillment("takeaway")}
                    icon={<ShoppingBag size={18} />}
                    label="Takeaway"
                    sub="Collect at reception"
                  />
                  {settings.deliveryEnabled && (
                    <FulfillmentTile
                      active={fulfillment === "delivery"}
                      onClick={() => setFulfillment("delivery")}
                      icon={<Bike size={18} />}
                      label="Delivery"
                      sub={`Within ${settings.deliveryRadiusKm} km`}
                    />
                  )}
                </div>
              </section>

              {/* Contact */}
              <section style={cardStyle}>
                <h2 style={sectionTitleStyle}>Contact</h2>
                <div style={fieldGridStyle}>
                  <Field
                    label="Full name"
                    required
                    value={customerName}
                    onChange={setCustomerName}
                    autoComplete="name"
                  />
                  <Field
                    label="Phone"
                    required
                    type="tel"
                    inputMode="numeric"
                    value={customerPhone}
                    onChange={setCustomerPhone}
                    placeholder="10-digit mobile number"
                    autoComplete="tel"
                  />
                  <Field
                    label="Email (optional)"
                    type="email"
                    value={customerEmail}
                    onChange={setCustomerEmail}
                    autoComplete="email"
                  />
                </div>
              </section>

              {/* Mode-specific */}
              {fulfillment === "in_room" && (
                <section style={cardStyle}>
                  <h2 style={sectionTitleStyle}>Room details</h2>
                  <div style={fieldGridStyle}>
                    <Field
                      label="Room number"
                      required
                      value={roomNumber}
                      onChange={setRoomNumber}
                      placeholder="e.g. 204"
                    />
                  </div>
                </section>
              )}

              {fulfillment === "takeaway" && (
                <section style={cardStyle}>
                  <h2 style={sectionTitleStyle}>Pickup</h2>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic",
                      color: "rgba(255,255,255,0.45)",
                      fontSize: "0.95rem",
                      marginBottom: "0.7rem",
                    }}
                  >
                    Leave empty for ASAP — we&apos;ll start prep right away. Otherwise tell us when you&apos;d like to collect.
                  </p>
                  <div style={fieldGridStyle}>
                    <Field
                      label="Pickup time (optional)"
                      type="datetime-local"
                      value={pickupTime}
                      onChange={setPickupTime}
                    />
                  </div>
                </section>
              )}

              {fulfillment === "delivery" && (
                <section style={cardStyle}>
                  <h2 style={sectionTitleStyle}>Delivery address</h2>
                  <div style={fieldGridStyle}>
                    <Field
                      label="Street / building"
                      required
                      value={addressLine}
                      onChange={setAddressLine}
                      placeholder="House no, street, area"
                      autoComplete="street-address"
                    />
                    <Field
                      label="Landmark (optional)"
                      value={addressLandmark}
                      onChange={setAddressLandmark}
                      placeholder="Near …"
                    />
                    <Field
                      label="PIN (optional)"
                      value={addressPincode}
                      onChange={setAddressPincode}
                      inputMode="numeric"
                      autoComplete="postal-code"
                    />
                  </div>

                  <div style={{ marginTop: "0.95rem" }}>
                    <button
                      type="button"
                      onClick={requestLocation}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "0.55rem 0.85rem",
                        backgroundColor: "transparent",
                        color: "#C9A84C",
                        border: "1px solid rgba(201,168,76,0.5)",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.7rem",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {geo.kind === "loading" ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <MapPin size={13} />
                      )}
                      Use my location
                    </button>
                    <GeoStatus
                      state={geo}
                      radiusKm={settings.deliveryRadiusKm}
                    />
                  </div>
                </section>
              )}

              {/* Payment mode */}
              <section style={cardStyle}>
                <h2 style={sectionTitleStyle}>Payment</h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 8,
                    marginTop: "0.8rem",
                  }}
                >
                  <PaymentTile
                    active={paymentMode === "online"}
                    onClick={() => setPaymentMode("online")}
                    icon={<CreditCard size={18} />}
                    label="Pay online"
                    sub="Card · UPI · Wallet"
                  />
                  <PaymentTile
                    active={paymentMode === "cod"}
                    onClick={() => setPaymentMode("cod")}
                    icon={<Wallet size={18} />}
                    label={
                      fulfillment === "delivery"
                        ? "Pay on delivery"
                        : fulfillment === "in_room"
                        ? "Pay at room"
                        : "Pay at pickup"
                    }
                    sub="Cash / UPI to staff"
                  />
                </div>
              </section>

              {/* Notes */}
              <section style={cardStyle}>
                <h2 style={sectionTitleStyle}>
                  Notes for the kitchen{" "}
                  <span style={optionalTagStyle}>optional</span>
                </h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Less spicy, extra mint chutney, allergies…"
                  style={textareaStyle}
                />
              </section>
            </div>

            {/* ===================== RIGHT: summary ===================== */}
            <aside
              className="md:sticky md:top-4 md:self-start"
              style={{
                ...cardStyle,
                position: "relative",
              }}
            >
              <h2 style={sectionTitleStyle}>Order summary</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: "0.5rem 0 0" }}>
                {groupedItems.map((it) => (
                  <li
                    key={it.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "0.4rem 0",
                      borderBottom: "1px dashed rgba(255,255,255,0.07)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.82rem",
                        color: "rgba(255,255,255,0.85)",
                      }}
                    >
                      <strong style={{ color: "#C9A84C", marginRight: 6 }}>
                        {it.qty}×
                      </strong>
                      {it.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "0.85rem",
                        color: "#fff",
                        fontVariantNumeric: "tabular-nums",
                        flexShrink: 0,
                      }}
                    >
                      {INR(it.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              <Row label="Subtotal" value={INR(subtotalPaise)} />
              {fulfillment === "delivery" && (
                <Row
                  label={`Delivery (${settings.deliveryRadiusKm} km radius)`}
                  value={INR(deliveryFeePaise)}
                />
              )}
              {taxPaise > 0 && (
                <Row
                  label={`GST (${settings.gstPercent}%)`}
                  value={INR(taxPaise)}
                />
              )}
              <Row label="Total" value={INR(totalPaise)} emphasize />

              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.6rem 0.75rem",
                  backgroundColor: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  color: "#C9A84C",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.7rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                {paymentMode === "online"
                  ? "Pay online · Card / UPI / Wallet"
                  : fulfillment === "delivery"
                  ? "Pay on delivery"
                  : fulfillment === "in_room"
                  ? "Pay at room"
                  : "Pay at pickup"}
              </div>

              {error && (
                <div
                  role="alert"
                  style={{
                    marginTop: "0.85rem",
                    padding: "0.6rem 0.75rem",
                    backgroundColor: "rgba(229,115,109,0.1)",
                    border: "1px solid rgba(229,115,109,0.4)",
                    color: "#F5B5B0",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.78rem",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={pending}
                style={{
                  marginTop: "1rem",
                  width: "100%",
                  padding: "0.95rem",
                  backgroundColor: "#C9A84C",
                  color: "#000",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.75rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  cursor: pending ? "wait" : "pointer",
                  opacity: pending ? 0.7 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {pending && <Loader2 size={14} className="animate-spin" />}
                {pending
                  ? paymentMode === "online"
                    ? "Opening payment…"
                    : "Placing order…"
                  : paymentMode === "online"
                  ? `Pay ${INR(totalPaise)}`
                  : "Place order"}
              </button>
            </aside>
          </div>
        </div>
      </form>

      {/* Online-payment modal — only mounted when paymentOrder is set. */}
      <DemoPaymentModal
        order={paymentOrder}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
        onDismiss={handlePaymentDismiss}
        onConfirm={async (orderId) => {
          const r = await confirmOnlinePayment(orderId, { simulated: true });
          return r.ok ? { ok: true, id: r.orderId } : r;
        }}
        onFail={(orderId, reason) => failOnlinePayment(orderId, reason)}
      />
    </div>
  );
}

/* =================================================================== */
/* Subcomponents                                                       */
/* =================================================================== */

function PaymentTile({
  active,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 6,
        padding: "0.85rem",
        backgroundColor: active ? "rgba(201,168,76,0.12)" : "transparent",
        border: `1px solid ${active ? "#C9A84C" : "rgba(255,255,255,0.08)"}`,
        color: active ? "#C9A84C" : "rgba(255,255,255,0.7)",
        cursor: "pointer",
        textAlign: "left",
        transition: "background-color 0.15s, border-color 0.15s, color 0.15s",
      }}
    >
      <span style={{ color: active ? "#C9A84C" : "rgba(255,255,255,0.55)" }}>
        {icon}
      </span>
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.78rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontSize: "0.85rem",
          color: "rgba(255,255,255,0.45)",
        }}
      >
        {sub}
      </span>
    </button>
  );
}

function FulfillmentTile({
  active,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 6,
        padding: "0.85rem",
        backgroundColor: active ? "rgba(201,168,76,0.12)" : "transparent",
        border: `1px solid ${active ? "#C9A84C" : "rgba(255,255,255,0.08)"}`,
        color: active ? "#C9A84C" : "rgba(255,255,255,0.7)",
        cursor: "pointer",
        textAlign: "left",
        transition: "background-color 0.15s, border-color 0.15s, color 0.15s",
      }}
    >
      <span style={{ color: active ? "#C9A84C" : "rgba(255,255,255,0.55)" }}>
        {icon}
      </span>
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.78rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontSize: "0.85rem",
          color: "rgba(255,255,255,0.45)",
        }}
      >
        {sub}
      </span>
    </button>
  );
}

function Field({
  label,
  required,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
}: {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "text" | "email" | "tel";
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.65rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          fontWeight: 600,
        }}
      >
        {label}
        {required && <span style={{ color: "#C9A84C", marginLeft: 4 }}>*</span>}
      </span>
      <input
        type={type ?? "text"}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        style={inputStyle}
      />
    </label>
  );
}

function GeoStatus({
  state,
  radiusKm,
}: {
  state: GeoState;
  radiusKm: number;
}) {
  if (state.kind === "idle") return null;
  if (state.kind === "loading") {
    return (
      <p style={geoStatusBaseStyle}>Locating you…</p>
    );
  }
  if (state.kind === "denied") {
    return (
      <p style={{ ...geoStatusBaseStyle, color: "rgba(255,255,255,0.55)" }}>
        {state.message}
      </p>
    );
  }
  // ok
  if (state.distanceKm == null) {
    return (
      <p style={{ ...geoStatusBaseStyle, color: "#C9A84C" }}>
        <CircleCheck size={13} /> Location captured. Staff will confirm range on receipt.
      </p>
    );
  }
  const inside = state.distanceKm <= radiusKm;
  return (
    <p
      style={{
        ...geoStatusBaseStyle,
        color: inside ? "#9CCB8A" : "#F5B5B0",
      }}
    >
      {inside ? <CircleCheck size={13} /> : <CircleAlert size={13} />}
      {inside
        ? `You're ${state.distanceKm.toFixed(1)} km away — inside our ${radiusKm} km range.`
        : `You're ${state.distanceKm.toFixed(1)} km away — outside our ${radiusKm} km range. Try takeaway.`}
    </p>
  );
}

function Row({
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
        padding: "0.5rem 0",
        borderTop: emphasize ? "1px solid rgba(255,255,255,0.1)" : undefined,
        marginTop: emphasize ? "0.4rem" : 0,
      }}
    >
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: emphasize ? "0.78rem" : "0.74rem",
          letterSpacing: emphasize ? "0.22em" : "0.16em",
          textTransform: "uppercase",
          color: emphasize ? "#C9A84C" : "rgba(255,255,255,0.55)",
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

/* =================================================================== */
/* Styles                                                              */
/* =================================================================== */

const pageStyle: React.CSSProperties = {
  backgroundColor: "#07070d",
  minHeight: "100vh",
  color: "#fff",
};
const backLinkStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "0.7rem",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.45)",
  fontWeight: 500,
};
const eyebrowRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: "0.5rem",
};
const eyebrowStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "0.68rem",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: "#C9A84C",
  fontWeight: 600,
};
const h1Style: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  color: "#fff",
  fontSize: "clamp(1.9rem, 4vw, 2.6rem)",
  fontWeight: 400,
  lineHeight: 1.1,
  margin: 0,
};
const cardStyle: React.CSSProperties = {
  backgroundColor: "#0d0d16",
  border: "1px solid rgba(255,255,255,0.05)",
  padding: "1.15rem 1.15rem",
};
const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  color: "#fff",
  fontSize: "1.05rem",
  fontWeight: 500,
  margin: 0,
};
const fieldGridStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.85rem",
  marginTop: "0.85rem",
};
const inputStyle: React.CSSProperties = {
  backgroundColor: "#07070d",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  padding: "0.65rem 0.75rem",
  fontFamily: "'Inter', sans-serif",
  fontSize: "0.88rem",
  outline: "none",
};
const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  marginTop: "0.65rem",
  width: "100%",
  resize: "vertical",
  fontFamily: "'Inter', sans-serif",
};
const optionalTagStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "0.6rem",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.4)",
  fontWeight: 500,
  marginLeft: 8,
};
const geoStatusBaseStyle: React.CSSProperties = {
  marginTop: "0.6rem",
  fontFamily: "'Inter', sans-serif",
  fontSize: "0.78rem",
  color: "rgba(255,255,255,0.7)",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};
