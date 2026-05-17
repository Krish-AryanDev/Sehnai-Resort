"use client";

import { Search, X } from "lucide-react";

export type FilterState = {
  query: string;
  vegOnly: boolean;
};

export function FilterBar({
  state,
  onChange,
}: {
  state: FilterState;
  onChange: (next: FilterState) => void;
}) {
  return (
    <div className="flex items-center gap-3 w-full">
      <div
        className="flex items-center gap-2 flex-1"
        style={{
          backgroundColor: "#0a0a13",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "0.55rem 0.85rem",
        }}
      >
        <Search size={14} style={{ color: "#C9A84C" }} />
        <input
          type="text"
          value={state.query}
          onChange={(e) => onChange({ ...state, query: e.target.value })}
          placeholder="Search dishes…"
          className="bg-transparent outline-none flex-1 min-w-0"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.85rem",
            color: "#fff",
          }}
        />
        {state.query && (
          <button
            type="button"
            onClick={() => onChange({ ...state, query: "" })}
            aria-label="Clear search"
            style={{ color: "rgba(255,255,255,0.55)", display: "flex" }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange({ ...state, vegOnly: !state.vegOnly })}
        aria-pressed={state.vegOnly}
        className="flex items-center gap-2 shrink-0"
        style={{
          padding: "0.55rem 0.85rem",
          backgroundColor: state.vegOnly ? "#3F7D2A" : "#0a0a13",
          border: `1px solid ${
            state.vegOnly ? "#3F7D2A" : "rgba(255,255,255,0.08)"
          }`,
          color: state.vegOnly ? "#fff" : "rgba(255,255,255,0.75)",
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.72rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 600,
          transition: "background-color 0.15s, color 0.15s, border-color 0.15s",
        }}
      >
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 12,
            height: 12,
            border: `1.5px solid ${state.vegOnly ? "#fff" : "#3F7D2A"}`,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: state.vegOnly ? "#fff" : "#3F7D2A",
            }}
          />
        </span>
        Veg only
      </button>
    </div>
  );
}
