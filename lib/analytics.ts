/**
 * Vendor-neutral analytics wrapper.
 *
 * The site currently emits to GA4 via the `gtag` global injected by
 * <Analytics />. Swapping to Plausible, Posthog, or a self-hosted Supabase
 * sink later means changing only this file — call sites stay unchanged.
 *
 * Event taxonomy (defined here so it's discoverable / typed):
 *
 *   book_now_clicked  — user pressed Book Now on the room detail page.
 *                       The primary conversion event.
 *   modal_confirmed   — user pressed "I Understand — Continue" inside the
 *                       no-refund modal. The user has committed to booking
 *                       (currently → tel:; soon → Razorpay).
 *   modal_dismissed   — user closed the modal via overlay/Cancel/Esc/X.
 *                       Bounce rate inside the modal.
 *   call_clicked      — user pressed the Call to Book link/icon.
 *                       Tracks phone-fallback usage.
 *
 * Surface is "booking_summary" for the sticky-right card on desktop
 * (inline on mobile) and "mobile_sticky" for the fixed bottom bar.
 */

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

type BookingContext = {
  variant_id: string | null;
  category_id: string;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  total: number;
  locale?: string;
};

type EventMap = {
  book_now_clicked: BookingContext & {
    surface: "booking_summary" | "mobile_sticky";
  };
  modal_confirmed: BookingContext & {
    assigned_room_id: string | null;
  };
  modal_dismissed: BookingContext;
  call_clicked: BookingContext & {
    surface: "booking_summary" | "mobile_sticky";
  };
};

type EventName = keyof EventMap;

/** Fire an analytics event. Safe to call in any environment — no-ops when
 *  no sink is configured. Calls before gtag has finished loading are queued
 *  by the GA4 stub in <Analytics />. */
export function track<E extends EventName>(name: E, props: EventMap[E]): void {
  // Always log in dev so call sites are debuggable without a GA property.
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${name}`, props);
  }
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", name, props);
}

/** Compute the half-open night count for a YYYY-MM-DD range. Centralised
 *  so every event carries a consistent value (the BookingSummary computes
 *  the same number locally for the price total). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const [sy, sm, sd] = checkIn.split("-").map(Number);
  const [ey, em, ed] = checkOut.split("-").map(Number);
  const a = new Date(sy, sm - 1, sd).getTime();
  const b = new Date(ey, em - 1, ed).getTime();
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}
