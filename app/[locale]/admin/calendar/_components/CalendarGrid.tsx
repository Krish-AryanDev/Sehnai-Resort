import Link from "next/link";

export type CalendarRoom = {
  id: string;
  roomNumber: string;
  variantName: string;
  categoryName: string;
};

export type CalendarBooking = {
  id: string;
  roomId: string;
  checkIn: string;   // YYYY-MM-DD
  checkOut: string;  // YYYY-MM-DD (half-open: not occupied this night)
  status: "pending" | "confirmed";
  source: "admin" | "online";
  guestName: string | null;
};

/* ----- date utils local to this component ----- */

function parseIso(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDays(s: string, n: number): string {
  const d = parseIso(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}
function dayDiff(a: string, b: string): number {
  // Days from b → a, ignoring DST drift.
  return Math.round((parseIso(a).getTime() - parseIso(b).getTime()) / 86_400_000);
}
function isWeekend(s: string): boolean {
  const dow = parseIso(s).getDay();
  return dow === 0 || dow === 6;
}
function todayIso(): string {
  return iso(new Date());
}

/**
 * Single CSS-grid: 1 + days columns × 1 + rooms rows. Day cells render
 * empty by default; bookings are placed as continuous bars spanning their
 * date range via grid-column. No client JS — pure SSR.
 */
export function CalendarGrid({
  rooms,
  bookings,
  start,
  days,
}: {
  rooms: CalendarRoom[];
  bookings: CalendarBooking[];
  start: string;
  days: number;
}) {
  const today = todayIso();
  const dayList = Array.from({ length: days }, (_, i) => addDays(start, i));
  const roomIndex = new Map(rooms.map((r, i) => [r.id, i]));

  return (
    <div className="cal-wrap admin-card" style={{ padding: 0, overflow: "auto" }}>
      <div
        className="cal-grid"
        style={{
          gridTemplateColumns: `220px repeat(${days}, 64px)`,
        }}
      >
        {/* Top-left corner */}
        <div className="cal-corner" />

        {/* Day header row */}
        {dayList.map((d) => {
          const date = parseIso(d);
          const isToday = d === today;
          const weekend = isWeekend(d);
          return (
            <div
              key={d}
              className={`cal-day-header${isToday ? " cal-day-header--today" : ""}${weekend ? " cal-day-header--weekend" : ""}`}
            >
              <div className="cal-day-dow">
                {date.toLocaleDateString("en-IN", { weekday: "short" })}
              </div>
              <div className="cal-day-num">
                {date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              </div>
            </div>
          );
        })}

        {/* For each room: label cell + 14 empty day cells */}
        {rooms.map((room, ri) => (
          <RoomRow
            key={room.id}
            room={room}
            rowIndex={ri}
            dayList={dayList}
            today={today}
          />
        ))}

        {/* Bookings overlay — each placed at its room row + date column span */}
        {bookings.map((b) => {
          const ri = roomIndex.get(b.roomId);
          if (ri === undefined) return null;

          // Clip booking to the visible window.
          const startIdx = Math.max(0, dayDiff(b.checkIn, start));
          const endIdxExclusive = Math.min(days, dayDiff(b.checkOut, start));
          if (endIdxExclusive <= 0 || startIdx >= days) return null;
          if (endIdxExclusive <= startIdx) return null;

          // +2 because col 1 is the room label and grid is 1-indexed.
          const colStart = startIdx + 2;
          const colEnd = endIdxExclusive + 2;

          const clippedLeft = b.checkIn < start;
          const clippedRight = b.checkOut > addDays(start, days);

          return (
            <Link
              key={b.id}
              href={`/admin/bookings/${b.id}`}
              className={`cal-bar cal-bar--${b.status}${b.source === "admin" ? " cal-bar--admin" : ""}`}
              style={{
                gridRow: ri + 2,
                gridColumn: `${colStart} / ${colEnd}`,
                borderTopLeftRadius: clippedLeft ? 0 : undefined,
                borderBottomLeftRadius: clippedLeft ? 0 : undefined,
                borderTopRightRadius: clippedRight ? 0 : undefined,
                borderBottomRightRadius: clippedRight ? 0 : undefined,
              }}
              title={tooltip(b)}
            >
              <span className="cal-bar-label">
                {b.guestName || (b.source === "admin" ? "Admin block" : "Booking")}
              </span>
              <span className="cal-bar-dates">
                {formatShort(b.checkIn)}–{formatShort(b.checkOut)}
              </span>
            </Link>
          );
        })}
      </div>

      {bookings.length === 0 && (
        <div style={{ padding: "1rem", color: "#78716c", fontSize: 13, borderTop: "1px solid #e7e5e4" }}>
          No bookings in this window.
        </div>
      )}
    </div>
  );
}

function RoomRow({
  room,
  rowIndex,
  dayList,
  today,
}: {
  room: CalendarRoom;
  rowIndex: number;
  dayList: string[];
  today: string;
}) {
  return (
    <>
      <div className="cal-room-label" style={{ gridRow: rowIndex + 2 }}>
        <div className="cal-room-number">Room {room.roomNumber}</div>
        <div className="cal-room-variant">{room.variantName}</div>
      </div>
      {dayList.map((d, di) => {
        const weekend = isWeekend(d);
        const isToday = d === today;
        return (
          <div
            key={d}
            className={`cal-day-cell${weekend ? " cal-day-cell--weekend" : ""}${isToday ? " cal-day-cell--today" : ""}`}
            style={{ gridRow: rowIndex + 2, gridColumn: di + 2 }}
          />
        );
      })}
    </>
  );
}

function tooltip(b: CalendarBooking): string {
  const who = b.guestName ?? (b.source === "admin" ? "Admin block" : "Booking");
  return `${who}\n${b.checkIn} → ${b.checkOut}\nStatus: ${b.status}`;
}

function formatShort(s: string): string {
  return parseIso(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
