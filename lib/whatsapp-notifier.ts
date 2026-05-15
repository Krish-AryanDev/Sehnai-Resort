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

export async function notifyAdmin(message: string): Promise<NotifyResult> {
  const provider = (process.env.WHATSAPP_PROVIDER ?? "log") as Provider;
  const adminNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  if (!adminNumber) {
    return { ok: false, error: "NEXT_PUBLIC_WHATSAPP_NUMBER not set." };
  }

  try {
    switch (provider) {
      case "log":
        return logProvider(adminNumber, message);
      case "callmebot":
        return await callMeBotProvider(adminNumber, message);
      case "cloudapi":
        return await cloudApiProvider(adminNumber, message);
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
