import "server-only";

/**
 * WhatsApp notification dispatcher for admin alerts.
 *
 * Picks a provider at runtime from `WHATSAPP_PROVIDER`. The `log` provider
 * is the default — it console-logs the message and returns success, so the
 * feature is exercisable end-to-end without any third-party account.
 *
 * Real delivery options (pick one when going live):
 *
 *   callmebot   — Free service for personal WhatsApp numbers. Setup: send
 *                 "I allow callmebot to send me messages" to +34 644 51 95 23
 *                 on WhatsApp from the admin's phone, wait for the reply
 *                 with your API key, paste into CALLMEBOT_API_KEY. Five-
 *                 minute setup, no business account needed.
 *
 *   cloudapi    — Meta's official WhatsApp Cloud API. Free for ~1k
 *                 conversations/month. Setup: Meta Business verification +
 *                 phone number + a permanent access token + the destination
 *                 phone number id. Free-form text only reaches the admin if
 *                 they messaged the business number in the last 24h —
 *                 templates needed for unsolicited messages. Production-
 *                 grade but heavier setup (~2-3 days for verification).
 *
 *   twilio      — Paid (~$0.005/msg). Implementation not included here
 *                 (use the @ /SDK if/when you adopt it).
 *
 * Calls NEVER throw. Returns `{ ok, error? }` so the caller can log without
 * unwinding the booking-confirmation flow.
 */

type Provider = "log" | "callmebot" | "cloudapi" | "twilio";

export type NotifyResult = { ok: true } | { ok: false; error: string };

/** Low-level dispatcher used by every notify*. Picks a provider from
 *  env and forwards `(to, message)`. NEVER throws. */
async function notify(to: string, message: string): Promise<NotifyResult> {
  const provider = (process.env.WHATSAPP_PROVIDER ?? "log") as Provider;
  try {
    switch (provider) {
      case "log":
        return logProvider(to, message);
      case "callmebot":
        return await callMeBotProvider(to, message);
      case "cloudapi":
        return await cloudApiProvider(to, message);
      case "twilio":
        return {
          ok: false,
          error:
            "Twilio provider is not implemented. Pick callmebot or cloudapi, or wire Twilio's SDK here.",
        };
      default:
        return { ok: false, error: `Unknown WHATSAPP_PROVIDER: ${provider}` };
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Ping the admin's WhatsApp number from `NEXT_PUBLIC_WHATSAPP_NUMBER`. */
export async function notifyAdmin(message: string): Promise<NotifyResult> {
  const adminNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!adminNumber) {
    return { ok: false, error: "NEXT_PUBLIC_WHATSAPP_NUMBER not set." };
  }
  return notify(adminNumber, message);
}

/** Ping an arbitrary customer phone. Phone should be digits with country
 *  code; callers are expected to normalise. Returns `{ ok: false }` for
 *  blank phones rather than throwing — the customer ping is fire-and-log
 *  and a missing phone is just a no-op for our purposes. */
export async function notifyCustomer(
  phone: string | null | undefined,
  message: string
): Promise<NotifyResult> {
  const digits = (phone ?? "").replace(/[^\d]/g, "");
  if (digits.length < 10) {
    return { ok: false, error: "Customer phone is missing or too short." };
  }
  return notify(digits, message);
}

/* ------------------------------------------------------------------ */
/* Provider implementations                                           */
/* ------------------------------------------------------------------ */

function logProvider(to: string, message: string): NotifyResult {
  // eslint-disable-next-line no-console
  console.log("[whatsapp:log]", { to, message });
  return { ok: true };
}

async function callMeBotProvider(
  to: string,
  message: string
): Promise<NotifyResult> {
  const apiKey = process.env.CALLMEBOT_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error:
        "CALLMEBOT_API_KEY not set. Get one by messaging +34 644 51 95 23 on WhatsApp.",
    };
  }

  // CallMeBot wants the number with country code, no '+' or spaces.
  const phone = to.replace(/[^\d]/g, "");
  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", message);
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      ok: false,
      error: `CallMeBot HTTP ${res.status}: ${body.slice(0, 200)}`,
    };
  }
  return { ok: true };
}

async function cloudApiProvider(
  to: string,
  message: string
): Promise<NotifyResult> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return {
      ok: false,
      error:
        "WHATSAPP_CLOUD_API_TOKEN or WHATSAPP_CLOUD_API_PHONE_NUMBER_ID not set.",
    };
  }

  const res = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      ok: false,
      error: `Cloud API HTTP ${res.status}: ${body.slice(0, 300)}`,
    };
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Message formatter                                                  */
/* ------------------------------------------------------------------ */

/** Pretty-print a food-order confirmation for the admin's WhatsApp. Fires
 *  on order placement (COD) or payment confirmation (online). */
export function formatOrderConfirmationMessage(args: {
  shortCode: string;
  fulfillment: "in_room" | "takeaway" | "delivery";
  paymentMode: "online" | "cod";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  items: { name: string; variant: "single" | "half" | "full"; qty: number }[];
  subtotalPaise: number;
  deliveryFeePaise: number;
  taxPaise: number;
  totalPaise: number;
  customerName: string;
  customerPhone: string;
  roomNumber: string | null;
  addressLine: string | null;
  addressLandmark: string | null;
  addressPincode: string | null;
  pickupTime: string | null;
  notes: string | null;
  adminUrl: string | null;
}): string {
  const inr = (paise: number) =>
    `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const fulfillmentLabel: Record<typeof args.fulfillment, string> = {
    in_room: "In-room",
    takeaway: "Takeaway",
    delivery: "Delivery",
  };
  const variantLabel = (v: "single" | "half" | "full") =>
    v === "single" ? "" : v === "half" ? " (Half)" : " (Full)";

  const lines = [
    `New food order — ${args.shortCode}`,
    `${fulfillmentLabel[args.fulfillment]} · ${args.paymentMode.toUpperCase()} · ${args.paymentStatus}`,
    "",
    "Items:",
    ...args.items.map(
      (i) => `  ${i.qty}× ${i.name}${variantLabel(i.variant)}`
    ),
    "",
    `Subtotal: ${inr(args.subtotalPaise)}`,
  ];

  if (args.deliveryFeePaise > 0) {
    lines.push(`Delivery:  ${inr(args.deliveryFeePaise)}`);
  }
  if (args.taxPaise > 0) {
    lines.push(`GST:       ${inr(args.taxPaise)}`);
  }
  lines.push(`Total:     ${inr(args.totalPaise)}`);

  lines.push("");
  lines.push("Customer:");
  lines.push(`  Name:  ${args.customerName}`);
  lines.push(`  Phone: ${args.customerPhone}`);

  if (args.fulfillment === "in_room" && args.roomNumber) {
    lines.push(`  Room:  ${args.roomNumber}`);
  }
  if (args.fulfillment === "delivery") {
    if (args.addressLine) lines.push(`  Address: ${args.addressLine}`);
    if (args.addressLandmark) lines.push(`  Landmark: ${args.addressLandmark}`);
    if (args.addressPincode) lines.push(`  PIN: ${args.addressPincode}`);
  }
  if (args.fulfillment === "takeaway" && args.pickupTime) {
    lines.push(`  Pickup: ${args.pickupTime}`);
  }
  if (args.notes) {
    lines.push("");
    lines.push(`Notes: ${args.notes}`);
  }
  if (args.adminUrl) {
    lines.push("");
    lines.push(args.adminUrl);
  }
  return lines.join("\n");
}

/** Pretty-print a customer-facing status update sent on each kitchen
 *  advancement. Wording branches on fulfillment so an in-room diner
 *  doesn't get "out for delivery" pings. */
export function formatOrderStatusMessage(args: {
  shortCode: string;
  status:
    | "accepted"
    | "preparing"
    | "ready"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  fulfillment: "in_room" | "takeaway" | "delivery";
  customerName: string;
  cancelledReason?: string | null;
  trackingUrl?: string | null;
}): string | null {
  // out_for_delivery is only meaningful for delivery orders. The kitchen
  // state machine forces every order through it, but in-room/takeaway
  // customers shouldn't see it on WhatsApp — return null and the caller
  // skips the send.
  if (
    args.status === "out_for_delivery" &&
    args.fulfillment !== "delivery"
  ) {
    return null;
  }

  const greet = `Hi ${args.customerName.split(" ")[0] || "there"},`;
  const body = (() => {
    switch (args.status) {
      case "accepted":
        return `your order ${args.shortCode} has been accepted by our kitchen.`;
      case "preparing":
        return `your order ${args.shortCode} is being prepared now.`;
      case "ready":
        if (args.fulfillment === "delivery") {
          return `your order ${args.shortCode} is ready and heading out for delivery shortly.`;
        }
        if (args.fulfillment === "takeaway") {
          return `your order ${args.shortCode} is ready for pickup at reception.`;
        }
        return `your order ${args.shortCode} is ready — we'll bring it to your room shortly.`;
      case "out_for_delivery":
        return `your order ${args.shortCode} is on its way. Our staff will reach you shortly.`;
      case "delivered":
        if (args.fulfillment === "delivery") {
          return `your order ${args.shortCode} has been delivered. Hope you enjoy it!`;
        }
        if (args.fulfillment === "takeaway") {
          return `your order ${args.shortCode} has been collected. Hope you enjoy it!`;
        }
        return `your order ${args.shortCode} has been delivered to your room. Hope you enjoy it!`;
      case "cancelled":
        return `your order ${args.shortCode} has been cancelled${
          args.cancelledReason ? ` — ${args.cancelledReason}` : ""
        }. Please reach out to reception if this is unexpected.`;
    }
  })();

  const lines = [greet, "", body];
  if (args.trackingUrl) {
    lines.push("", `Track: ${args.trackingUrl}`);
  }
  lines.push("", "— Shehnai Resort");
  return lines.join("\n");
}

/** Pretty-print a booking confirmation for the admin's WhatsApp. */
export function formatBookingConfirmationMessage(args: {
  bookingId: string;
  roomNumber: string;
  variantName: string;
  categoryName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  provider: string | null;
  adminUrl: string | null;
}): string {
  const isDemo = args.provider === "demo";

  const lines = [
    `New booking confirmed — Shehnai Resort${isDemo ? " (DEMO)" : ""}`,
    "",
    `Room: ${args.variantName} · ${args.categoryName}`,
    `Room number: ${args.roomNumber}`,
    `Check-in:  ${args.checkIn}`,
    `Check-out: ${args.checkOut}`,
    `Nights: ${args.nights}`,
    `Total: ₹${args.total.toLocaleString("en-IN")}`,
  ];

  if (args.guestName || args.guestPhone || args.guestEmail) {
    lines.push("");
    lines.push("Guest:");
    if (args.guestName) lines.push(`  Name:  ${args.guestName}`);
    if (args.guestPhone) lines.push(`  Phone: ${args.guestPhone}`);
    if (args.guestEmail) lines.push(`  Email: ${args.guestEmail}`);
  }

  lines.push("");
  lines.push(`Booking ID: ${args.bookingId}`);

  if (args.adminUrl) {
    lines.push(args.adminUrl);
  }

  if (isDemo) {
    lines.push("");
    lines.push("(This is a DEMO booking — no real payment was processed.)");
  }

  return lines.join("\n");
}
