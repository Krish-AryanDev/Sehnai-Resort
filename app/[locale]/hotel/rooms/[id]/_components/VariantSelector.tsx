"use client";

import { Check, Users, BedDouble } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RoomVariant, RoomBooking } from "@/lib/rooms-data";
import { countAvailableInVariant } from "@/lib/rooms-data";

type VariantSelectorProps = {
  variants: RoomVariant[];
  selectedId: string;
  onSelect: (variantId: string) => void;
  checkIn: string;
  checkOut: string;
  bookings: RoomBooking[];
};

/**
 * Radio-card group. Each card shows variant name, pitch, price, room count.
 * A card is disabled when no individual rooms in that variant are free for
 * the chosen dates (per countAvailableInVariant).
 */
export function VariantSelector({
  variants,
  selectedId,
  onSelect,
  checkIn,
  checkOut,
  bookings,
}: VariantSelectorProps) {
  const t = useTranslations("roomDetail");

  return (
    <div className="grid grid-cols-1 gap-4">
      {variants.map((v) => {
        const available = countAvailableInVariant(
          v.id,
          checkIn,
          checkOut,
          bookings
        );
        const isSoldOut = available === 0;
        const isSelected = v.id === selectedId;

        return (
          <button
            key={v.id}
            type="button"
            onClick={() => !isSoldOut && onSelect(v.id)}
            disabled={isSoldOut}
            aria-pressed={isSelected}
            className="text-left p-4 sm:p-5 transition-all duration-300 w-full"
            style={{
              backgroundColor: isSelected
                ? "rgba(201,168,76,0.06)"
                : "#0a0a13",
              border: isSelected
                ? "1px solid #C9A84C"
                : "1px solid rgba(255,255,255,0.05)",
              opacity: isSoldOut ? 0.45 : 1,
              cursor: isSoldOut ? "not-allowed" : "pointer",
            }}
          >
            {/* Stacks vertically on mobile, side-by-side from sm up */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <h4
                      className="text-white font-playfair truncate"
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "1.05rem",
                        fontWeight: 500,
                      }}
                    >
                      {v.name}
                    </h4>
                    {isSelected && !isSoldOut && (
                      <Check size={14} className="text-[#C9A84C] shrink-0" />
                    )}
                  </div>

                  {/* Inline mobile price — visible only on < sm so the user sees
                      the price next to the name without a tall stack. */}
                  <span
                    className="sm:hidden font-playfair shrink-0"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: "#C9A84C",
                      fontSize: "1.1rem",
                      fontWeight: 500,
                      lineHeight: 1.1,
                    }}
                  >
                    ₹{v.pricePerNight.toLocaleString("en-IN")}
                  </span>
                </div>

                <p
                  className="text-white/45 mb-3"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.8rem",
                    lineHeight: 1.6,
                    fontWeight: 300,
                  }}
                >
                  {v.shortPitch}
                </p>

                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <span
                    className="flex items-center gap-1.5 text-white/55"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.72rem",
                    }}
                  >
                    <BedDouble size={12} className="text-[#C9A84C]" />
                    {v.bedType}
                  </span>
                  <span
                    className="flex items-center gap-1.5 text-white/55"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.72rem",
                    }}
                  >
                    <Users size={12} className="text-[#C9A84C]" />
                    {v.maxGuests} {t("guests")}
                  </span>
                  <span
                    className="text-white/40"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.72rem",
                    }}
                  >
                    {v.sizeSqFt} sq ft
                  </span>
                  {/* Availability moves inline with the meta row on mobile */}
                  <span
                    className="sm:hidden"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.7rem",
                      letterSpacing: "0.06em",
                      color: isSoldOut ? "#c97a72" : "rgba(255,255,255,0.5)",
                      fontWeight: 500,
                    }}
                  >
                    {isSoldOut
                      ? t("soldOut")
                      : t("roomsAvailable", { count: available })}
                  </span>
                </div>
              </div>

              {/* Desktop/tablet price column — hidden on mobile */}
              <div className="hidden sm:block text-right shrink-0">
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
                  ₹{v.pricePerNight.toLocaleString("en-IN")}
                </p>
                <p
                  className="text-white/35 mt-0.5"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.65rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {t("perNight")}
                </p>
                <p
                  className="mt-2"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.65rem",
                    letterSpacing: "0.08em",
                    color: isSoldOut ? "#c97a72" : "rgba(255,255,255,0.4)",
                    fontWeight: 500,
                  }}
                >
                  {isSoldOut
                    ? t("soldOut")
                    : t("roomsAvailable", { count: available })}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
