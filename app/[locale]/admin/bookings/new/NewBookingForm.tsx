"use client";

import { useTransition, useState } from "react";
import { createBlockBooking } from "./actions";

export type RoomOption = { id: string; label: string };

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function tomorrowIso() {
  return new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
}

export function NewBookingForm({
  rooms,
  defaultRoomId,
}: {
  rooms: RoomOption[];
  defaultRoomId?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [checkIn, setCheckIn] = useState(todayIso());
  const [checkOut, setCheckOut] = useState(tomorrowIso());

  return (
    <form
      action={(fd) => startTransition(() => createBlockBooking(fd))}
    >
      <div className="admin-field">
        <label htmlFor="roomId">Room</label>
        <select id="roomId" name="roomId" defaultValue={defaultRoomId} required>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-field admin-field--row">
        <div>
          <label htmlFor="checkIn">Check-in</label>
          <input
            id="checkIn"
            name="checkIn"
            type="date"
            value={checkIn}
            min={todayIso()}
            onChange={(e) => setCheckIn(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="checkOut">Check-out</label>
          <input
            id="checkOut"
            name="checkOut"
            type="date"
            value={checkOut}
            min={checkIn}
            onChange={(e) => setCheckOut(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="admin-field">
        <label htmlFor="guestName">Guest name (optional)</label>
        <input
          id="guestName"
          name="guestName"
          type="text"
          autoComplete="off"
          placeholder="e.g. Rajesh Kumar — or 'Maintenance'"
        />
      </div>

      <div className="admin-field admin-field--row">
        <div>
          <label htmlFor="guestPhone">Phone (optional)</label>
          <input
            id="guestPhone"
            name="guestPhone"
            type="tel"
            autoComplete="off"
            placeholder="+91…"
          />
        </div>
        <div>
          <label htmlFor="guestEmail">Email (optional)</label>
          <input
            id="guestEmail"
            name="guestEmail"
            type="email"
            autoComplete="off"
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: ".5rem", marginTop: "1rem" }}>
        <button
          type="submit"
          className="admin-button admin-button--primary"
          disabled={pending}
        >
          {pending ? "Saving…" : "Create block"}
        </button>
      </div>
    </form>
  );
}
