"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const SESSION_KEY = "sehnai_intro_seen";
const VISIBLE_DURATION = 1300; // ms before exit animation begins
const EASE_OUT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export function IntroScreen() {
  const [show, setShow] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);

    // Skip on subsequent navigations within the same session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Respect reduced-motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sessionStorage.setItem(SESSION_KEY, "1");
      return;
    }

    setShow(true);

    // Lock scroll while the intro plays
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setShow(false);
    }, VISIBLE_DURATION);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Avoid SSR/CSR mismatch — only render after hydration
  if (!hydrated) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="fixed inset-0 z-[10000] flex items-center justify-center"
          style={{ backgroundColor: "#07070d" }}
        >
          {/* Faint radial vignette for depth */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at center, rgba(201,168,76,0.07) 0%, rgba(7,7,13,0) 60%)",
            }}
          />

          <div className="relative flex flex-col items-center gap-5">
            {/* "THE" eyebrow */}
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15, ease: EASE_OUT }}
              style={{
                color: "#C9A84C",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.65rem",
                letterSpacing: "0.55em",
                fontWeight: 500,
                paddingLeft: "0.55em", // compensate for letter-spacing trailing space
              }}
            >
              THE
            </motion.span>

            {/* Wordmark — letter-spacing collapse for the "settle" effect */}
            <motion.span
              initial={{ opacity: 0, letterSpacing: "0.6em" }}
              animate={{ opacity: 1, letterSpacing: "0.18em" }}
              transition={{ duration: 1.1, delay: 0.3, ease: EASE_OUT }}
              style={{
                color: "#ffffff",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(1.5rem, 4vw, 2.6rem)",
                fontWeight: 400,
                whiteSpace: "nowrap",
                paddingLeft: "0.18em",
              }}
            >
              SEHNAI RESORT
            </motion.span>

            {/* Drawing gold line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.5, ease: EASE_OUT }}
              style={{
                width: 96,
                height: 1,
                backgroundColor: "#C9A84C",
                transformOrigin: "center",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
