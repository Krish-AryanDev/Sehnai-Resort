"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SmartImage } from "@/components/SmartImage";

type RoomGalleryProps = {
  images: string[];
  alt: string;
};

// Minimum horizontal travel (in px) to count as a swipe. Vertical-dominant
// movements are ignored so the page can still be scrolled with a finger.
const SWIPE_THRESHOLD = 40;

/**
 * Airbnb-style gallery: 1 large hero + 4 thumbnails on desktop.
 * On mobile: swipe left/right (bounded — no wrap) with edge-aware arrows.
 */
export function RoomGallery({ images, alt }: RoomGalleryProps) {
  const [active, setActive] = useState(0);
  const hero = images[active] ?? images[0];
  const thumbs = images.slice(0, 4);

  const canPrev = active > 0;
  const canNext = active < images.length - 1;

  const goPrev = () => setActive((a) => Math.max(0, a - 1));
  const goNext = () => setActive((a) => Math.min(images.length - 1, a + 1));

  // Touch tracking — we capture the start point and decide direction on end.
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // Ignore primarily-vertical gestures so vertical page scrolling still works
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3" style={{ minHeight: "300px" }}>
      {/* Hero image */}
      <div
        className="relative lg:col-span-2 lg:row-span-2 overflow-hidden"
        style={{ aspectRatio: "4/3", touchAction: "pan-y" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-label={`${alt} — image ${active + 1} of ${images.length}`}
      >
        <SmartImage
          src={hero}
          alt={alt}
          containerClassName="absolute inset-0"
          hoverScale={1.04}
          priority
        />
        <div
          className="absolute top-0 left-0 w-10 h-10 pointer-events-none"
          style={{ borderTop: "2px solid #C9A84C", borderLeft: "2px solid #C9A84C" }}
        />
        <div
          className="absolute bottom-0 right-0 w-10 h-10 pointer-events-none"
          style={{ borderBottom: "2px solid #C9A84C", borderRight: "2px solid #C9A84C" }}
        />

        {/* Edge-aware nav arrows — mobile only. Each renders only when that
            direction is reachable (no wrap), matching the swipe bounds. */}
        {canPrev && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous image"
            className="lg:hidden absolute top-1/2 -translate-y-1/2 left-3 flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: "9999px",
              backgroundColor: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {canNext && (
          <button
            type="button"
            onClick={goNext}
            aria-label="Next image"
            className="lg:hidden absolute top-1/2 -translate-y-1/2 right-3 flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: "9999px",
              backgroundColor: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Mobile counter pill */}
        {images.length > 1 && (
          <div
            className="lg:hidden absolute bottom-3 left-3 pointer-events-none"
            style={{
              backgroundColor: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(4px)",
              padding: "5px 10px",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.65rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.85)",
              fontWeight: 500,
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {active + 1} / {images.length}
          </div>
        )}

        {/* Dot pagination — mobile only */}
        {images.length > 1 && (
          <div className="lg:hidden absolute bottom-3 right-3 flex items-center gap-1.5 pointer-events-none">
            {images.map((_, i) => (
              <span
                key={i}
                className="block rounded-full transition-all"
                style={{
                  width: i === active ? 18 : 6,
                  height: 6,
                  backgroundColor: i === active ? "#C9A84C" : "rgba(255,255,255,0.45)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails — desktop only */}
      {thumbs.map((src, i) => (
        <button
          key={`thumb-${i}`}
          type="button"
          className="relative overflow-hidden hidden lg:block"
          style={{
            aspectRatio: "4/3",
            border:
              active === i
                ? "1px solid #C9A84C"
                : "1px solid rgba(255,255,255,0.05)",
          }}
          onClick={() => setActive(i)}
          aria-label={`View image ${i + 1}`}
        >
          <SmartImage
            src={src}
            alt={`${alt} ${i + 1}`}
            containerClassName="absolute inset-0"
            hoverScale={1.06}
          />
          {active === i && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: "rgba(201,168,76,0.08)" }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
