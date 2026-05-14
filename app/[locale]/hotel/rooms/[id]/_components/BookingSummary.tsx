"use client";

import { Phone, Calendar, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RoomVariant } from "@/lib/rooms-data";

type BookingSummaryProps = {
  variant: RoomVariant | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  onBookNow: () => void;
  callHref: string;
  isSoldOut: boolean;
};

/**
 * Sticky right-column booking card. Read-only date/guest fields for this
 * iteration — the real date picker arrives with the payment integration.
 * The "Book Now" button delegates to `onBookNow`, which opens the
 * NoRefundDialog at the page level.
 */
export function BookingSummary({
  variant,
  checkIn,
  checkOut,
  guests,
  onBookNow,
  callHref,
  isSoldOut,
}: BookingSummaryProps) {
  const t = useTranslations("roomDetail");

  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = variant ? variant.pricePerNight * nights : 0;

  return (
    <aside
      className="p-5 sm:p-6 md:p-7"
      style={{
        backgroundColor: "#0d0d16",
        border: "1px solid rgba(201,168,76,0.18)",
        position: "relative",
      }}
    >
      {/* Decorative top corner mark */}
      <div
        className="absolute top-0 left-0 w-10 h-10 pointer-events-none"
        style={{ borderTop: "2px solid #C9A84C", borderLeft: "2px solid #C9A84C" }}
      />
      <div
        className="absolute bottom-0 right-0 w-10 h-10 pointer-events-none"
        style={{ borderBottom: "2px solid #C9A84C", borderRight: "2px solid #C9A84C" }}
      />

      {/* Price */}
      <div className="mb-5">
        <p
          className="text-white/40"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.65rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {variant ? variant.name : t("startingFrom")}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <span
            className="font-playfair"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#C9A84C",
              fontSize: "2rem",
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            ₹{(variant?.pricePerNight ?? 0).toLocaleString("en-IN")}
          </span>
          <span
            className="text-white/40"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.78rem",
            }}
          >
            {t("perNight")}
          </span>
        </div>
      </div>

      <div
        className="h-px w-full mb-5"
        style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
      />

      {/* Date / guest fields — read-only placeholders */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <ReadOnlyField icon={<Calendar size={11} />} label={t("checkIn")} value={formatDate(checkIn)} />
        <ReadOnlyField icon={<Calendar size={11} />} label={t("checkOut")} value={formatDate(checkOut)} />
      </div>
      <div className="mb-6">
        <ReadOnlyField icon={<Users size={11} />} label={t("guests")} value={`${guests}`} />
      </div>

      {/* Total */}
      <div
        className="flex items-baseline justify-between mb-6 pt-5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div>
          <p
            className="text-white"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1rem",
              fontWeight: 500,
            }}
          >
            {t("total")}
          </p>
          <p
            className="text-white/40"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.7rem",
            }}
          >
            {t("nights", { count: nights })}
          </p>
        </div>
        <span
          className="font-playfair"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "#C9A84C",
            fontSize: "1.4rem",
            fontWeight: 500,
          }}
        >
          ₹{subtotal.toLocaleString("en-IN")}
        </span>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onBookNow}
          disabled={!variant || isSoldOut}
          className="btn-premium w-full flex items-center justify-center gap-2"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.7rem",
            letterSpacing: "0.22em",
            fontWeight: 700,
            textTransform: "uppercase",
            padding: "0.95rem 1.6rem",
            backgroundColor: "#C9A84C",
            color: "#000",
            border: "none",
            opacity: !variant || isSoldOut ? 0.45 : 1,
            cursor: !variant || isSoldOut ? "not-allowed" : "pointer",
          }}
        >
          {t("bookNow")}
        </button>

        <a
          href={callHref}
          className="btn-premium-outline w-full flex items-center justify-center gap-2"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.7rem",
            letterSpacing: "0.22em",
            fontWeight: 600,
            textTransform: "uppercase",
            padding: "0.85rem 1.6rem",
            backgroundColor: "transparent",
            color: "#C9A84C",
            border: "1px solid rgba(201,168,76,0.35)",
          }}
        >
          <Phone size={12} />
          {t("callToBook")}
        </a>
      </div>
    </aside>
  );
}

/* ----------------------------------------------------------------------
   Sub-components & utils
   ---------------------------------------------------------------------- */

function ReadOnlyField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="p-3"
      style={{
        backgroundColor: "#0a0a13",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[#C9A84C]">{icon}</span>
        <span
          className="text-white/40"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.6rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>
      <span
        className="text-white"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.85rem",
          fontWeight: 500,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function formatDate(iso: string): string {
  // "YYYY-MM-DD" -> "12 Jun"
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function nightsBetween(start: string, end: string): number {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const a = new Date(sy, sm - 1, sd).getTime();
  const b = new Date(ey, em - 1, ed).getTime();
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}
