"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Check } from "lucide-react";

/**
 * Small clipboard-copy button used on the booking receipt to copy the
 * Booking ID. Lives in a client component because clipboard access needs the
 * browser — the receipt page itself is a server component.
 *
 * Shows a transient "Copied" state for ~1.8s, then reverts. Falls back to a
 * hidden-textarea + execCommand path for the rare browser/context where the
 * async Clipboard API isn't available (e.g. non-secure origins).
 */
export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the pending reset timer if the component unmounts mid-flash.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        legacyCopy(value);
      }
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Last-ditch fallback; if this throws too, there's nothing useful to do.
      try {
        legacyCopy(value);
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1800);
      } catch {
        /* clipboard genuinely unavailable — leave the UI unchanged */
      }
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : `${label} ${value}`}
      title={copied ? "Copied" : label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        flexShrink: 0,
        padding: "3px 8px",
        marginLeft: 8,
        cursor: "pointer",
        backgroundColor: copied
          ? "rgba(110,231,183,0.12)"
          : "rgba(201,168,76,0.1)",
        border: copied
          ? "1px solid rgba(110,231,183,0.4)"
          : "1px solid rgba(201,168,76,0.35)",
        color: copied ? "#6ee7b7" : "#C9A84C",
        fontFamily: "'Inter', sans-serif",
        fontSize: "0.62rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        fontWeight: 600,
        borderRadius: 3,
        lineHeight: 1,
        transition: "background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease",
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : label}
    </button>
  );
}

/** Hidden-textarea fallback for non-secure origins / older browsers. */
function legacyCopy(text: string): void {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "absolute";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}
