"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

type DateRangePickerProps = {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
};

/**
 * Two trigger fields (Check-in / Check-out) that open a shared single-month
 * calendar popover. Past dates are disabled; selecting check-in after the
 * current check-out auto-rolls check-out forward to in+1.
 */
export function DateRangePicker({
  checkIn,
  checkOut,
  onChange,
}: DateRangePickerProps) {
  const t = useTranslations("roomDetail");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState<"in" | "out">("in");
  const [viewMonth, setViewMonth] = useState<string>(() => firstOfMonth(checkIn));
  const [hover, setHover] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const today = todayIso();
  const monthFloor = firstOfMonth(today);

  const handlePick = (iso: string) => {
    if (focused === "in") {
      if (iso >= checkOut) {
        onChange(iso, addDays(iso, 1));
      } else {
        onChange(iso, checkOut);
      }
      setFocused("out");
    } else {
      if (iso <= checkIn) {
        onChange(iso, addDays(iso, 1));
        setFocused("out");
      } else {
        onChange(checkIn, iso);
        setOpen(false);
      }
    }
  };

  const canGoPrev = useMemo(
    () => addMonths(viewMonth, -1) >= monthFloor,
    [viewMonth, monthFloor]
  );

  const openFor = (field: "in" | "out") => {
    setFocused(field);
    setViewMonth(firstOfMonth(field === "in" ? checkIn : checkOut));
    setOpen(true);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="grid grid-cols-2 gap-3">
        <FieldButton
          label={t("checkIn")}
          value={formatDayMonth(checkIn, locale)}
          weekday={formatWeekday(checkIn, locale)}
          active={open && focused === "in"}
          onClick={() => openFor("in")}
        />
        <FieldButton
          label={t("checkOut")}
          value={formatDayMonth(checkOut, locale)}
          weekday={formatWeekday(checkOut, locale)}
          active={open && focused === "out"}
          onClick={() => openFor("out")}
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 mt-2 z-50 p-4"
            style={{
              backgroundColor: "#0d0d16",
              border: "1px solid rgba(201,168,76,0.35)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <NavBtn
                disabled={!canGoPrev}
                onClick={() => canGoPrev && setViewMonth(addMonths(viewMonth, -1))}
                label="Previous month"
              >
                <ChevronLeft size={13} />
              </NavBtn>
              <span
                className="text-white"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                }}
              >
                {monthLabel(viewMonth, locale)}
              </span>
              <NavBtn
                disabled={false}
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                label="Next month"
              >
                <ChevronRight size={13} />
              </NavBtn>
            </div>

            <MonthGrid
              monthStart={viewMonth}
              checkIn={checkIn}
              checkOut={checkOut}
              today={today}
              hover={hover}
              focused={focused}
              onHover={setHover}
              onPick={handlePick}
              locale={locale}
            />

            <div
              className="mt-3 pt-3 flex items-center justify-between gap-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p
                className="text-white/45 min-w-0 truncate"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.7rem",
                }}
              >
                {focused === "in"
                  ? t("dates.pickCheckIn")
                  : t("dates.pickCheckOut")}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.65rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: "#C9A84C",
                  padding: "0.45rem 0.9rem",
                  border: "1px solid rgba(201,168,76,0.35)",
                  cursor: "pointer",
                  backgroundColor: "transparent",
                }}
              >
                {t("dates.done")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------------------------------------------------
   Sub-components
   ---------------------------------------------------------------------- */

function FieldButton({
  label,
  value,
  weekday,
  active,
  onClick,
}: {
  label: string;
  value: string;
  weekday: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-3 text-left transition-colors duration-200"
      style={{
        backgroundColor: "#0a0a13",
        border: active
          ? "1px solid #C9A84C"
          : "1px solid rgba(255,255,255,0.05)",
        cursor: "pointer",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Calendar size={11} className="text-[#C9A84C]" />
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
        className="text-white block"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.85rem",
          fontWeight: 500,
        }}
      >
        {value}
      </span>
      <span
        className="text-white/40 block mt-0.5"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.65rem",
        }}
      >
        {weekday}
      </span>
    </button>
  );
}

function NavBtn({
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
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-7 h-7 flex items-center justify-center transition-colors duration-200"
      style={{
        color: disabled ? "rgba(255,255,255,0.15)" : "#C9A84C",
        border: disabled
          ? "1px solid rgba(255,255,255,0.05)"
          : "1px solid rgba(201,168,76,0.3)",
        backgroundColor: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function MonthGrid({
  monthStart,
  checkIn,
  checkOut,
  today,
  hover,
  focused,
  onHover,
  onPick,
  locale,
}: {
  monthStart: string;
  checkIn: string;
  checkOut: string;
  today: string;
  hover: string | null;
  focused: "in" | "out";
  onHover: (iso: string | null) => void;
  onPick: (iso: string) => void;
  locale: string;
}) {
  const days = buildMonthGrid(monthStart);
  const weekdays = weekdayLabels(locale);
  const tentativeEnd =
    focused === "out" && hover && hover > checkIn ? hover : null;
  const rangeEnd = tentativeEnd ?? checkOut;

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {weekdays.map((w, i) => (
          <div
            key={i}
            className="text-center text-white/35"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 600,
              padding: "0.35rem 0",
            }}
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((d, i) => {
          if (!d) return <div key={i} />;
          const isPast = d < today;
          const isCheckIn = d === checkIn;
          const isCheckOut = d === checkOut;
          const inRange = d > checkIn && d < rangeEnd;

          let bg = "transparent";
          let fg = "rgba(255,255,255,0.7)";
          let border = "1px solid transparent";

          if (isPast) {
            fg = "rgba(255,255,255,0.15)";
          } else if (isCheckIn || isCheckOut) {
            bg = "#C9A84C";
            fg = "#000";
          } else if (inRange) {
            bg = "rgba(201,168,76,0.18)";
            fg = "#C9A84C";
          } else if (d === today) {
            border = "1px solid rgba(201,168,76,0.45)";
          }

          return (
            <button
              key={i}
              type="button"
              disabled={isPast}
              onMouseEnter={() => onHover(d)}
              onMouseLeave={() => onHover(null)}
              onClick={() => !isPast && onPick(d)}
              className="aspect-square flex items-center justify-center transition-colors duration-150"
              style={{
                backgroundColor: bg,
                color: fg,
                border,
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.78rem",
                fontWeight: isCheckIn || isCheckOut ? 600 : 400,
                cursor: isPast ? "not-allowed" : "pointer",
              }}
            >
              {parseInt(d.split("-")[2], 10)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------
   Date utils — keep ISO strings as the source of truth to dodge TZ bugs.
   ---------------------------------------------------------------------- */

function todayIso(): string {
  return iso(new Date());
}
function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseIso(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function firstOfMonth(s: string): string {
  const d = parseIso(s);
  return iso(new Date(d.getFullYear(), d.getMonth(), 1));
}
function addDays(s: string, n: number): string {
  const d = parseIso(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}
function addMonths(s: string, n: number): string {
  const d = parseIso(s);
  d.setMonth(d.getMonth() + n, 1);
  return iso(d);
}

function buildMonthGrid(monthStart: string): (string | null)[] {
  const start = parseIso(monthStart);
  const firstWeekday = start.getDay(); // 0=Sun..6=Sat
  const daysInMonth = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    0
  ).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(iso(new Date(start.getFullYear(), start.getMonth(), d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function intlLocale(locale: string): string {
  return locale === "hi" ? "hi-IN" : "en-IN";
}
function formatDayMonth(s: string, locale: string): string {
  return parseIso(s).toLocaleDateString(intlLocale(locale), {
    day: "2-digit",
    month: "short",
  });
}
function formatWeekday(s: string, locale: string): string {
  return parseIso(s).toLocaleDateString(intlLocale(locale), {
    weekday: "long",
  });
}
function monthLabel(s: string, locale: string): string {
  return parseIso(s).toLocaleDateString(intlLocale(locale), {
    month: "long",
    year: "numeric",
  });
}
function weekdayLabels(locale: string): string[] {
  // Jan 7 2024 was a Sunday → use it as the Sunday seed.
  const seed = new Date(2024, 0, 7);
  const fmt = new Intl.DateTimeFormat(intlLocale(locale), { weekday: "narrow" });
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(seed);
    d.setDate(seed.getDate() + i);
    return fmt.format(d);
  });
}
