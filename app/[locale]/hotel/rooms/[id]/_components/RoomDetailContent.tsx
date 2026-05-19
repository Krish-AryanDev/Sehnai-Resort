"use client";

import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Check, AlertTriangle, BedDouble, Users, Maximize2, Wifi, Phone } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { FadeIn } from "@/components/FadeIn";
import { Link } from "@/i18n/navigation";
import { siteLinks } from "@/lib/site-config";
import {
  type RoomCategory,
  type RoomBooking,
  roomCategories,
  findAvailableRoomForVariant,
  countAvailableInVariant,
} from "@/lib/rooms-data";
import { track, nightsBetween } from "@/lib/analytics";
import type { PaymentOrder } from "@/lib/payment-provider";
import { useRouter } from "@/i18n/navigation";
import { RoomGallery } from "./RoomGallery";
import { VariantSelector } from "./VariantSelector";
import { BookingSummary } from "./BookingSummary";
import { NoRefundDialog } from "./NoRefundDialog";
import { StayStrip } from "./StayStrip";
import { DemoPaymentModal } from "@/components/DemoPaymentModal";
import {
  createPaymentOrder,
  confirmPayment,
  failPayment,
  cancelPayment,
} from "../_actions/payment";

type RoomDetailContentProps = {
  category: RoomCategory;
  bookings: RoomBooking[];
};

/**
 * Client-side orchestrator for the room detail page. Owns:
 *   - selected variant
 *   - check-in / check-out (placeholder defaults today / today+1)
 *   - guest count
 *   - NoRefundDialog open state
 */
export function RoomDetailContent({ category, bookings }: RoomDetailContentProps) {
  const t = useTranslations("roomDetail");
  const locale = useLocale();

  // ---- Placeholder default dates (today, today + 1) ----
  const defaults = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86_400_000);
    return { checkIn: iso(today), checkOut: iso(tomorrow) };
  }, []);

  const [checkIn, setCheckIn] = useState(defaults.checkIn);
  const [checkOut, setCheckOut] = useState(defaults.checkOut);
  const [guests, setGuests] = useState(2);

  // Default-select the cheapest variant that has availability for these dates
  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
    const sorted = [...category.variants].sort(
      (a, b) => a.pricePerNight - b.pricePerNight
    );
    return (
      sorted.find(
        (v) =>
          countAvailableInVariant(
            v.id,
            defaults.checkIn,
            defaults.checkOut,
            bookings
          ) > 0
      )?.id ?? category.variants[0].id
    );
  });

  const selectedVariant =
    category.variants.find((v) => v.id === selectedVariantId) ?? null;
  const selectedSoldOut =
    selectedVariant
      ? countAvailableInVariant(
          selectedVariant.id,
          checkIn,
          checkOut,
          bookings
        ) === 0
      : false;

  // Clamp guest count when switching to a variant with a lower max capacity.
  useEffect(() => {
    if (selectedVariant && guests > selectedVariant.maxGuests) {
      setGuests(selectedVariant.maxGuests);
    }
  }, [selectedVariant, guests]);

  const handleDatesChange = (newCheckIn: string, newCheckOut: string) => {
    setCheckIn(newCheckIn);
    setCheckOut(newCheckOut);
  };

  const [dialogOpen, setDialogOpen] = useState(false);

  /* Payment flow state — null means no payment in progress. */
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const router = useRouter();

  /* Other categories — shown at the bottom of the page */
  const otherCategories = roomCategories.filter((c) => c.id !== category.id);

  /** Snapshot of booking state attached to every analytics event. Computed
   *  fresh per call so it reflects whatever the user has in the form right
   *  now (variant, dates, guests). */
  const bookingContext = () => {
    const nights = nightsBetween(checkIn, checkOut);
    return {
      variant_id: selectedVariant?.id ?? null,
      category_id: category.id,
      check_in: checkIn,
      check_out: checkOut,
      nights,
      guests,
      total: selectedVariant ? selectedVariant.pricePerNight * nights : 0,
      locale,
    };
  };

  const handleBookNow = (surface: "booking_summary" | "mobile_sticky") => {
    track("book_now_clicked", { ...bookingContext(), surface });
    setDialogOpen(true);
  };

  const handleCallClick = (surface: "booking_summary" | "mobile_sticky") => {
    track("call_clicked", { ...bookingContext(), surface });
    // Anchor's href still drives navigation; this just fires the event first.
  };

  const handleModalDismiss = () => {
    track("modal_dismissed", bookingContext());
    setDialogOpen(false);
  };

  /* Triggered by the no-refund modal's "I Understand — Continue" button.
     Creates a pending booking via the active payment provider (today: demo;
     soon: Razorpay), then opens the payment modal. The demo flow lives in
     <DemoPaymentModal />; the Razorpay swap replaces that component +
     swaps the body of createPaymentOrder/confirmPayment server actions. */
  const handleConfirmBooking = async () => {
    if (!selectedVariant) return;

    // Optimistic guess for analytics — server may pick a different room.
    const optimisticRoom = findAvailableRoomForVariant(
      selectedVariant.id,
      checkIn,
      checkOut,
      bookings
    );
    track("modal_confirmed", {
      ...bookingContext(),
      assigned_room_id: optimisticRoom?.id ?? null,
    });
    setDialogOpen(false);

    const result = await createPaymentOrder({
      categoryId: category.id,
      variantId: selectedVariant.id,
      checkIn,
      checkOut,
      guests,
    });
    if (!result.ok) {
      setPaymentError(result.reason);
      return;
    }
    setPaymentError(null);
    setPaymentOrder(result.order);
    track("payment_initiated", {
      ...bookingContext(),
      provider: result.order.provider,
      order_id: result.order.orderId,
    });
  };

  const handlePaymentSuccess = (_paymentId: string, orderId: string) => {
    if (!paymentOrder || paymentOrder.kind !== "room") return;
    track("payment_succeeded", {
      ...bookingContext(),
      provider: paymentOrder.provider,
      order_id: orderId,
      booking_id: paymentOrder.bookingId,
    });
    const bookingId = paymentOrder.bookingId;
    // Clear modal state then navigate to the receipt page.
    setPaymentOrder(null);
    router.push(`/booking/${bookingId}`);
  };

  const handlePaymentFailure = async (reason: string, orderId: string) => {
    if (!paymentOrder) return;
    track("payment_failed", {
      ...bookingContext(),
      provider: paymentOrder.provider,
      order_id: orderId,
      reason,
    });
    // The DemoPaymentModal has already called failPayment server-side; this
    // is the analytics + UI side. Leaving the modal open on its error
    // screen so the user can retry.
  };

  const handlePaymentDismiss = async (orderId: string) => {
    if (!paymentOrder) return;
    track("payment_dismissed", {
      ...bookingContext(),
      provider: paymentOrder.provider,
      order_id: orderId,
    });
    setPaymentOrder(null);
    // Free the room hold on the server so the dates aren't stuck "pending".
    await cancelPayment(orderId);
  };

  return (
    <div style={{ backgroundColor: "#07070d" }}>
      {/* ============= HERO HEADER ============= */}
      <section className="pt-24 sm:pt-28 md:pt-32 pb-6 md:pb-10" style={{ backgroundColor: "#07070d" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          <FadeIn>
            <Link
              href="/hotel"
              className="inline-flex items-center gap-2 mb-6 md:mb-8 group"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.7rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.5)",
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform duration-300" />
              {t("back")}
            </Link>
          </FadeIn>

          <FadeIn delay={0.05}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-[#C9A84C]" />
              <span
                className="text-[#C9A84C] uppercase"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.68rem",
                  letterSpacing: "0.35em",
                  fontWeight: 500,
                }}
              >
                {category.name}
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1
              className="text-white font-playfair"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                maxWidth: "700px",
              }}
            >
              <span className="italic text-[#C9A84C]">{category.tagline}</span>
            </h1>
          </FadeIn>
        </div>
      </section>

      {/* ============= GALLERY ============= */}
      <section className="pb-6 md:pb-10" style={{ backgroundColor: "#07070d" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          <FadeIn>
            <RoomGallery
              images={[category.heroImage, ...category.galleryImages]}
              alt={category.name}
            />
          </FadeIn>
        </div>
      </section>

      {/* ============= MAIN GRID ============= */}
      {/* pb-28 on mobile leaves room for the sticky bottom CTA bar */}
      <section className="pb-28 lg:pb-20" style={{ backgroundColor: "#07070d" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 md:gap-10 lg:gap-14">
            {/* LEFT — content */}
            <div className="min-w-0">
              {/* About */}
              <FadeIn>
                <SectionEyebrow label={t("aboutTitle")} />
                <p
                  className="text-white/55 mb-7"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: "italic",
                    fontSize: "1.1rem",
                    lineHeight: 1.75,
                    fontWeight: 400,
                  }}
                >
                  {category.description}
                </p>

                {/* Highlight chips */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
                  {category.highlights.map((h, i) => {
                    const Icon = HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length];
                    return (
                      <div
                        key={h}
                        className="flex items-center gap-2 p-3"
                        style={{
                          backgroundColor: "#0d0d16",
                          border: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <Icon size={14} className="text-[#C9A84C] shrink-0" />
                        <span
                          className="text-white/70 truncate"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "0.75rem",
                            fontWeight: 400,
                          }}
                        >
                          {h}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </FadeIn>

              {/* Stay strip — mobile-only date + guest controls.
                  Lives above the variants so changing dates here makes the
                  "X rooms available" counts below recompute before the user
                  picks. On lg+, the same fields are inside <BookingSummary />. */}
              <div className="lg:hidden mb-10">
                <FadeIn>
                  <StayStrip
                    checkIn={checkIn}
                    checkOut={checkOut}
                    guests={guests}
                    maxGuests={selectedVariant?.maxGuests ?? 4}
                    onDatesChange={handleDatesChange}
                    onGuestsChange={setGuests}
                  />
                </FadeIn>
              </div>

              {/* Variant selector */}
              <FadeIn>
                <SectionEyebrow label={t("chooseVariantTitle")} />
                <p
                  className="text-white/45 mb-6"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.85rem",
                    fontWeight: 300,
                  }}
                >
                  {t("chooseVariantSubtitle")}
                </p>
                <VariantSelector
                  variants={category.variants}
                  selectedId={selectedVariantId}
                  onSelect={setSelectedVariantId}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  bookings={bookings}
                />
              </FadeIn>

              {/* Amenities */}
              <FadeIn>
                <div className="mt-12">
                  <SectionEyebrow label={t("amenitiesTitle")} />
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {category.amenities.map((a) => (
                      <li
                        key={a}
                        className="flex items-center gap-2.5"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "0.85rem",
                          color: "rgba(255,255,255,0.6)",
                          fontWeight: 300,
                        }}
                      >
                        <Check size={13} className="text-[#C9A84C] shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>

              {/* Policies */}
              <FadeIn>
                <div className="mt-12">
                  <SectionEyebrow label={t("policiesTitle")} />
                  <ul className="flex flex-col gap-3">
                    <PolicyLine text={t("policyCheckIn")} />
                    <PolicyLine text={t("policyCheckOut")} />
                    <li
                      className="flex items-start gap-2.5 p-3"
                      style={{
                        backgroundColor: "rgba(201,168,76,0.05)",
                        border: "1px solid rgba(201,168,76,0.25)",
                      }}
                    >
                      <AlertTriangle size={13} className="text-[#C9A84C] shrink-0 mt-0.5" />
                      <span
                        className="text-white/70"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "0.82rem",
                          fontWeight: 400,
                          lineHeight: 1.6,
                        }}
                      >
                        {t("policyNoRefund")}
                      </span>
                    </li>
                  </ul>
                </div>
              </FadeIn>
            </div>

            {/* RIGHT — sticky booking summary */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <BookingSummary
                variant={selectedVariant}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests}
                maxGuests={selectedVariant?.maxGuests ?? 4}
                onDatesChange={handleDatesChange}
                onGuestsChange={setGuests}
                onBookNow={() => handleBookNow("booking_summary")}
                onCallClick={() => handleCallClick("booking_summary")}
                callHref={siteLinks.tel}
                isSoldOut={selectedSoldOut}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============= OTHER ROOMS ============= */}
      <section
        className="pt-14 md:pt-20 pb-28 lg:pb-20"
        style={{
          backgroundColor: "#0d0d16",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          <FadeIn>
            <div className="flex items-center justify-center gap-3 mb-12 text-center">
              <div className="w-6 h-px bg-[#C9A84C]" />
              <span
                className="text-[#C9A84C] uppercase"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.68rem",
                  letterSpacing: "0.3em",
                  fontWeight: 500,
                }}
              >
                {t("otherRoomsTitle")}
              </span>
              <div className="w-6 h-px bg-[#C9A84C]" />
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {otherCategories.map((c, i) => (
              <FadeIn key={c.id} delay={i * 0.1}>
                <Link
                  href={`/hotel/rooms/${c.id}`}
                  className="block group"
                  style={{
                    backgroundColor: "#0a0a13",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <img
                      src={c.heroImage}
                      alt={c.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {c.highlight && (
                      <div
                        className="absolute top-3 right-3 uppercase"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "0.55rem",
                          letterSpacing: "0.2em",
                          fontWeight: 600,
                          color: "#000",
                          backgroundColor: "#C9A84C",
                          padding: "3px 8px",
                        }}
                      >
                        Most Popular
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3
                      className="text-white font-playfair mb-1"
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "1.2rem",
                        fontWeight: 400,
                      }}
                    >
                      {c.name}
                    </h3>
                    <p
                      className="text-white/45 mb-3"
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontStyle: "italic",
                        fontSize: "0.95rem",
                      }}
                    >
                      {c.tagline}
                    </p>
                    <p
                      className="text-[#C9A84C]"
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "0.95rem",
                      }}
                    >
                      From ₹
                      {Math.min(
                        ...c.variants.map((v) => v.pricePerNight)
                      ).toLocaleString("en-IN")}{" "}
                      {t("perNight")}
                    </p>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============= Mobile sticky bottom CTA ============= */}
      {/* Visible only below `lg` — gives a persistent Book/Call action so the
          user never has to scroll back up to the booking card. */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-40"
        style={{
          backgroundColor: "rgba(13,13,22,0.96)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid rgba(201,168,76,0.25)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p
              className="text-white/40 truncate"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.6rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {selectedVariant ? selectedVariant.name : t("startingFrom")}
            </p>
            <p
              className="font-playfair"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#C9A84C",
                fontSize: "1.25rem",
                fontWeight: 500,
                lineHeight: 1.1,
              }}
            >
              ₹{(selectedVariant?.pricePerNight ?? 0).toLocaleString("en-IN")}
              <span
                className="text-white/40 ml-1"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem" }}
              >
                {t("perNight")}
              </span>
            </p>
          </div>

          <a
            href={siteLinks.tel}
            onClick={() => handleCallClick("mobile_sticky")}
            aria-label={t("callToBook")}
            className="shrink-0 flex items-center justify-center"
            style={{
              width: "44px",
              height: "44px",
              border: "1px solid rgba(201,168,76,0.4)",
              color: "#C9A84C",
            }}
          >
            <Phone size={16} />
          </a>

          <button
            type="button"
            onClick={() => handleBookNow("mobile_sticky")}
            disabled={!selectedVariant || selectedSoldOut}
            className="shrink-0"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.68rem",
              letterSpacing: "0.2em",
              fontWeight: 700,
              textTransform: "uppercase",
              padding: "0.85rem 1.25rem",
              backgroundColor: "#C9A84C",
              color: "#000",
              border: "none",
              opacity: !selectedVariant || selectedSoldOut ? 0.45 : 1,
              cursor: !selectedVariant || selectedSoldOut ? "not-allowed" : "pointer",
            }}
          >
            {t("bookNow")}
          </button>
        </div>
      </div>

      {/* ============= Demo payment modal ============= */}
      <DemoPaymentModal
        order={paymentOrder}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
        onDismiss={handlePaymentDismiss}
        onConfirm={async (orderId) => {
          const r = await confirmPayment(orderId, { simulated: true });
          return r.ok ? { ok: true, id: r.bookingId } : r;
        }}
        onFail={(orderId, reason) => failPayment(orderId, reason)}
      />

      {/* ============= Inline error from createPaymentOrder ============= */}
      {paymentError && !paymentOrder && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
          style={{
            backgroundColor: "rgba(220,38,38,0.92)",
            color: "#fff",
            padding: "0.75rem 1.25rem",
            border: "1px solid rgba(254,202,202,0.6)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.8rem",
            maxWidth: 360,
            textAlign: "center",
          }}
          role="alert"
          onClick={() => setPaymentError(null)}
        >
          {paymentError} (tap to dismiss)
        </div>
      )}

      {/* ============= No-refund confirmation modal ============= */}
      <NoRefundDialog
        open={dialogOpen}
        onClose={handleModalDismiss}
        onConfirm={handleConfirmBooking}
      />
    </div>
  );
}

/* ---------- helpers ---------- */

function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const HIGHLIGHT_ICONS = [BedDouble, Maximize2, Users, Wifi];

function SectionEyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-px bg-[#C9A84C]" />
      <span
        className="text-[#C9A84C] uppercase"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.68rem",
          letterSpacing: "0.3em",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function PolicyLine({ text }: { text: string }) {
  return (
    <li
      className="flex items-center gap-2.5"
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "0.85rem",
        color: "rgba(255,255,255,0.6)",
        fontWeight: 300,
      }}
    >
      <div className="w-1 h-1 rounded-full bg-[#C9A84C]" />
      {text}
    </li>
  );
}
