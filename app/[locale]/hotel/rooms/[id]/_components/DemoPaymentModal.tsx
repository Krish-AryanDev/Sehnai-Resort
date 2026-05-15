"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CreditCard, ShieldCheck, X, CircleCheck, CircleX, Loader2 } from "lucide-react";
import type { PaymentOrder } from "@/lib/payment-provider";

type DemoPaymentModalProps = {
  /** Set to null to hide. The component re-mounts internal state when the
   *  order id changes. */
  order: PaymentOrder | null;
  onSuccess: (paymentId: string, orderId: string) => void;
  onFailure: (reason: string, orderId: string) => void;
  onDismiss: (orderId: string) => void;
  /** Server actions injected by the parent so this stays UI-only. */
  onConfirm: (orderId: string) => Promise<
    { ok: true; bookingId: string } | { ok: false; reason: string }
  >;
  onFail: (
    orderId: string,
    reason: string
  ) => Promise<{ ok: true } | { ok: false; reason: string }>;
};

type ScreenState =
  | { kind: "form" }
  | { kind: "processing" }
  | { kind: "done"; bookingId: string }
  | { kind: "error"; message: string };

/**
 * Demo payment provider UI. Mimics the shape of a payment-gateway modal
 * (order summary, large Pay button, simulated processing delay) without
 * touching any real money rails.
 *
 * The component intentionally signposts itself as a DEMO so testers can't
 * confuse it for production. When the real Razorpay flow lands, this
 * component is replaced by an opener that launches Razorpay's hosted
 * checkout — the parent props above don't need to change.
 */
export function DemoPaymentModal({
  order,
  onSuccess,
  onFailure,
  onDismiss,
  onConfirm,
  onFail,
}: DemoPaymentModalProps) {
  const open = order !== null;
  const [screen, setScreen] = useState<ScreenState>({ kind: "form" });
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset screen state when a new order opens.
  useEffect(() => {
    if (order) setScreen({ kind: "form" });
  }, [order?.orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc dismisses while modal is open and we're not mid-processing.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && screen.kind === "form") handleDismiss();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, screen.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!order) {
    return (
      <AnimatePresence>
        {open ? null : null}
      </AnimatePresence>
    );
  }

  const handleDismiss = () => {
    if (screen.kind === "processing" || screen.kind === "done") return;
    onDismiss(order.orderId);
  };

  const handlePay = () => {
    setScreen({ kind: "processing" });
    startTransition(async () => {
      // Slight artificial delay so testers see "processing" — purely cosmetic.
      await new Promise((r) => setTimeout(r, 900));
      const result = await onConfirm(order.orderId);
      if (result.ok) {
        setScreen({ kind: "done", bookingId: result.bookingId });
        // Brief success animation before the parent navigates away.
        setTimeout(() => onSuccess(`demo_pay_for_${order.orderId}`, order.orderId), 800);
      } else {
        setScreen({ kind: "error", message: result.reason });
      }
    });
  };

  const handleSimulateFailure = () => {
    setScreen({ kind: "processing" });
    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 600));
      const reason = "Simulated failure (demo)";
      await onFail(order.orderId, reason);
      setScreen({ kind: "error", message: reason });
      // Bubble up so the parent can fire analytics + show a toast.
      setTimeout(() => onFailure(reason, order.orderId), 50);
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-pay-title"
        >
          <button
            type="button"
            aria-label="Close payment"
            onClick={handleDismiss}
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
          />

          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative w-full max-w-md p-6 sm:p-7"
            style={{
              backgroundColor: "#0d0d16",
              border: "1px solid rgba(201,168,76,0.35)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.12)",
            }}
          >
            {/* Demo banner — explicit, hard to miss */}
            <div
              className="flex items-center gap-2 mb-5"
              style={{
                padding: "6px 10px",
                backgroundColor: "rgba(201,168,76,0.12)",
                border: "1px solid rgba(201,168,76,0.35)",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.65rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#C9A84C",
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={12} />
              Demo payment · No real money will be charged
            </div>

            {screen.kind !== "processing" && screen.kind !== "done" && (
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Close"
                className="absolute top-4 right-4 p-1"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                <X size={16} />
              </button>
            )}

            <div className="flex items-start gap-4 mb-5">
              <div
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  border: "1px solid rgba(201,168,76,0.4)",
                }}
              >
                <CreditCard size={20} className="text-[#C9A84C]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  id="demo-pay-title"
                  className="text-white font-playfair"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.3rem",
                    fontWeight: 500,
                    lineHeight: 1.2,
                  }}
                >
                  Confirm payment
                </h3>
                <p
                  className="text-white/45 mt-1"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.75rem",
                  }}
                >
                  Order {order.receipt}
                </p>
              </div>
            </div>

            <OrderSummary order={order} />

            {/* Screens */}
            {screen.kind === "form" && (
              <FormScreen
                amountPaise={order.amount}
                pending={pending}
                onPay={handlePay}
                onSimulateFailure={handleSimulateFailure}
              />
            )}
            {screen.kind === "processing" && <ProcessingScreen />}
            {screen.kind === "done" && <DoneScreen />}
            {screen.kind === "error" && (
              <ErrorScreen
                message={screen.message}
                onRetry={() => setScreen({ kind: "form" })}
                onClose={handleDismiss}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OrderSummary({ order }: { order: PaymentOrder }) {
  return (
    <div
      className="mb-5 p-3"
      style={{
        backgroundColor: "#0a0a13",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Row label="Room" value={order.booking.variantName} />
      <Row
        label="Stay"
        value={`${order.booking.checkIn} → ${order.booking.checkOut} (${order.booking.nights} night${order.booking.nights === 1 ? "" : "s"})`}
      />
      <Row label="Guests" value={String(order.booking.guests)} />
      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span
          className="text-white"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.8rem",
            fontWeight: 500,
          }}
        >
          Total
        </span>
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "#C9A84C",
            fontSize: "1.4rem",
            fontWeight: 500,
          }}
        >
          ₹{(order.amount / 100).toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between" style={{ marginBottom: 4 }}>
      <span
        className="text-white/45"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </span>
      <span
        className="text-white/85"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.82rem",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function FormScreen({
  amountPaise,
  pending,
  onPay,
  onSimulateFailure,
}: {
  amountPaise: number;
  pending: boolean;
  onPay: () => void;
  onSimulateFailure: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onPay}
        disabled={pending}
        className="w-full flex items-center justify-center gap-2"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.72rem",
          letterSpacing: "0.22em",
          fontWeight: 700,
          textTransform: "uppercase",
          padding: "1rem 1.6rem",
          backgroundColor: "#C9A84C",
          color: "#000",
          border: "none",
          opacity: pending ? 0.6 : 1,
          cursor: pending ? "not-allowed" : "pointer",
        }}
      >
        Pay ₹{(amountPaise / 100).toLocaleString("en-IN")}
      </button>

      <button
        type="button"
        onClick={onSimulateFailure}
        disabled={pending}
        className="w-full mt-3"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.65rem",
          letterSpacing: "0.18em",
          fontWeight: 500,
          textTransform: "uppercase",
          padding: "0.6rem",
          backgroundColor: "transparent",
          color: "rgba(255,255,255,0.4)",
          border: "1px dashed rgba(255,255,255,0.18)",
          cursor: pending ? "not-allowed" : "pointer",
        }}
      >
        Simulate failure (for testing)
      </button>
    </div>
  );
}

function ProcessingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 size={28} className="text-[#C9A84C] animate-spin" />
      <p
        className="text-white/65 mt-3"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.82rem",
        }}
      >
        Processing payment…
      </p>
    </div>
  );
}

function DoneScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <CircleCheck size={32} className="text-[#6ee7b7]" />
      <p
        className="text-white mt-3"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.9rem",
          fontWeight: 500,
        }}
      >
        Payment successful
      </p>
      <p
        className="text-white/45 mt-1"
        style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem" }}
      >
        Redirecting to your booking…
      </p>
    </div>
  );
}

function ErrorScreen({
  message,
  onRetry,
  onClose,
}: {
  message: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <CircleX size={28} className="text-[#fca5a5]" />
      <p
        className="text-white mt-3"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.88rem",
          fontWeight: 500,
        }}
      >
        Payment failed
      </p>
      <p
        className="text-white/55 mt-1 text-center"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.75rem",
          maxWidth: 300,
        }}
      >
        {message}
      </p>
      <div className="flex items-center gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.68rem",
            letterSpacing: "0.18em",
            fontWeight: 500,
            textTransform: "uppercase",
            padding: "0.6rem 1.1rem",
            backgroundColor: "transparent",
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.2)",
            cursor: "pointer",
          }}
        >
          Close
        </button>
        <button
          type="button"
          onClick={onRetry}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.68rem",
            letterSpacing: "0.18em",
            fontWeight: 700,
            textTransform: "uppercase",
            padding: "0.6rem 1.1rem",
            backgroundColor: "#C9A84C",
            color: "#000",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
