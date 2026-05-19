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
 *
 * `PaymentOrder` is a discriminated union over `kind`. Both the room-booking
 * flow (`kind: "room"`) and the food-ordering flow (`kind: "food"`) plug into
 * the same demo modal — the modal branches its summary section on `kind`.
 * Adding a new flow means adding a new variant here and one render branch in
 * the modal.
 */

export type PaymentProviderId = "demo" | "razorpay";

/** Common fields shared by every PaymentOrder variant. */
type PaymentOrderBase = {
  /** Provider-issued order id. Used as the key for confirm/fail/cancel. */
  orderId: string;
  amount: number;          // paise
  currency: "INR";
  /** Human-friendly reference shown in the modal + on the success page. */
  receipt: string;
  provider: PaymentProviderId;
};

/** Room-booking payment. `bookingId` is our internal `room_bookings.id`. */
export type RoomPaymentOrder = PaymentOrderBase & {
  kind: "room";
  bookingId: string;
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

/** Food-ordering payment. `foodOrderId` is our internal `restaurant_orders.id`. */
export type FoodPaymentOrder = PaymentOrderBase & {
  kind: "food";
  foodOrderId: string;
  food: {
    shortCode: string;
    fulfillment: "in_room" | "takeaway" | "delivery";
    items: Array<{
      name: string;
      variant: "single" | "half" | "full";
      qty: number;
      lineTotalPaise: number;
    }>;
    subtotalPaise: number;
    deliveryFeePaise: number;
    taxPaise: number;
  };
};

export type PaymentOrder = RoomPaymentOrder | FoodPaymentOrder;

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
