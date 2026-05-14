"use client";

import { Users, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

type GuestStepperProps = {
  value: number;
  max: number;
  onChange: (v: number) => void;
};

/**
 * +/- stepper for guest count. Clamped to [1, max]. The parent decides what
 * `max` is — usually `variant.maxGuests` so a 2-guest room can't accept 4.
 */
export function GuestStepper({ value, max, onChange }: GuestStepperProps) {
  const t = useTranslations("roomDetail");
  const safeMax = Math.max(1, max);
  const canDec = value > 1;
  const canInc = value < safeMax;

  return (
    <div
      className="p-3"
      style={{
        backgroundColor: "#0a0a13",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Users size={11} className="text-[#C9A84C]" />
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
          {t("guests")}
        </span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span
          className="text-white"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.85rem",
            fontWeight: 500,
          }}
        >
          {value} {t("guests")}
        </span>
        <div className="flex items-center gap-2">
          <StepBtn
            disabled={!canDec}
            onClick={() => canDec && onChange(value - 1)}
            label="Decrease guests"
          >
            <Minus size={11} />
          </StepBtn>
          <StepBtn
            disabled={!canInc}
            onClick={() => canInc && onChange(value + 1)}
            label="Increase guests"
          >
            <Plus size={11} />
          </StepBtn>
        </div>
      </div>
      <p
        className="text-white/35 mt-1.5"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.6rem",
        }}
      >
        {t("guestsMax", { count: safeMax })}
      </p>
    </div>
  );
}

function StepBtn({
  disabled,
  onClick,
  label,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="w-7 h-7 flex items-center justify-center transition-colors duration-200"
      style={{
        color: disabled ? "rgba(255,255,255,0.18)" : "#C9A84C",
        border: disabled
          ? "1px solid rgba(255,255,255,0.05)"
          : "1px solid rgba(201,168,76,0.35)",
        backgroundColor: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
