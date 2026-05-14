"use client";

import { DateRangePicker } from "./DateRangePicker";
import { GuestStepper } from "./GuestStepper";

type StayStripProps = {
  checkIn: string;
  checkOut: string;
  guests: number;
  maxGuests: number;
  onDatesChange: (checkIn: string, checkOut: string) => void;
  onGuestsChange: (n: number) => void;
};

/**
 * Mobile-only host for the date picker + guest stepper. Lives above the
 * <VariantSelector /> so guests can pick their stay before scanning room
 * availability — on lg+, the same controls live inside the sticky
 * <BookingSummary /> sidebar instead.
 */
export function StayStrip({
  checkIn,
  checkOut,
  guests,
  maxGuests,
  onDatesChange,
  onGuestsChange,
}: StayStripProps) {
  return (
    <div
      className="p-4 sm:p-5"
      style={{
        backgroundColor: "#0d0d16",
        border: "1px solid rgba(201,168,76,0.18)",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
        <DateRangePicker
          checkIn={checkIn}
          checkOut={checkOut}
          onChange={onDatesChange}
        />
        <GuestStepper
          value={guests}
          max={maxGuests}
          onChange={onGuestsChange}
        />
      </div>
    </div>
  );
}
