"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

/**
 * Mounts a Supabase Realtime subscription against `restaurant_orders` for
 * the admin kitchen queue. On any INSERT/UPDATE/DELETE it calls
 * `router.refresh()` so the server-rendered list re-fetches with the
 * service-role client and re-renders.
 *
 * On INSERT we also play a short chime so kitchen staff don't miss a
 * fresh order — synthesised via WebAudio so the app doesn't carry an
 * audio asset around. Browsers gate audio behind a user gesture; the
 * first call typically fails silently and subsequent calls work once
 * the admin has clicked anywhere on the page (in practice: opening the
 * orders page from the sidebar counts).
 *
 * Realtime backbone: see [0011_orders_realtime.sql](../../../../../db/migrations/0011_orders_realtime.sql).
 * If the channel never subscribes (publication missing, anon read policy
 * missing), the rest of the admin queue still works — the kitchen just
 * has to refresh the page manually.
 */
export function OrdersLive() {
  const router = useRouter();
  const isFirstEvent = useRef(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restaurant_orders" },
        (payload) => {
          // Skip the chime on the very first event after mount — Supabase
          // sometimes replays the last event on subscribe and we don't want
          // a spurious ding when the kitchen opens the page.
          const isFirst = isFirstEvent.current;
          isFirstEvent.current = false;
          if (!isFirst && payload.eventType === "INSERT") {
            playChime();
          }
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}

/** Short two-tone chime via WebAudio. Best-effort: browsers gate audio
 *  behind user gesture, so the first invocation often fails silently. */
function playChime(): void {
  if (typeof window === "undefined") return;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // Audio is best-effort. A page without sound is fine.
  }
}
