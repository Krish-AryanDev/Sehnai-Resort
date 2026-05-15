/**
 * Payment-provider abstraction.
 *
 * The shape here mirrors Razorpay's `Order` object closely so that swapping
 * the demo provider for the real Razorpay flow is a single-component change
 * (replace <DemoPaymentModal /> with <RazorpayCheckout />) plus an env flip.
 *
 * Amount is in PAISE (1 INR = 100 paise) — that's Razorpay's convention and
 * dodges floating-point bugs. The DB still stores rupee-denominated totals
 * via the variant price, but the order surface keeps everything in paise so
 * downstream code (server actions, modal UI, future Razorpay SDK) is
 * uniform.
 */

export type PaymentProviderId = "demo" | "razorpay";

export type PaymentOrder = {
  /** Provider-issued order id. Used as the key for confirm/fail/cancel. */
  orderId: string;
  /** Our internal room_bookings.id. The success page is keyed by this. */
  bookingId: string;
  amount: number;          // paise
  currency: "INR";
  /** Human-friendly reference shown in the modal + on the success page. */
  receipt: string;
  provider: PaymentProviderId;
  /** Snapshot of what the user is paying for. Shown in the demo modal and
   *  passed to Razorpay's checkout `notes` field when it lands. */
  booking: {
    categoryId: string;
    variantId: string;
    variantName: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    guests: number;
  };
};

export type PaymentSuccess = {
  status: "success";
  paymentId: string;
};
export type PaymentFailure = {
  status: "failed";
  reason: string;
};
export type PaymentDismissed = {
  status: "dismissed";
};
export type PaymentResult = PaymentSuccess | PaymentFailure | PaymentDismissed;

/** Read the active provider from server env. Falls back to "demo" so the
 *  flow works in any environment without explicit config. */
export function activePaymentProvider(): PaymentProviderId {
  const v = (process.env.PAYMENT_PROVIDER ?? "demo").toLowerCase();
  return v === "razorpay" ? "razorpay" : "demo";
}
