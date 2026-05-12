"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { siteLinks } from "@/lib/site-config";

const MESSAGES: Record<string, string> = {
  "/marriage-hall":
    "Hello, I'm interested in booking the marriage hall at Sehnai Resort. Could you share availability and packages?",
  "/restaurant":
    "Hello, I'd like to make a reservation at Sehnai Resort's restaurant. Could you help?",
  "/hotel":
    "Hello, I'd like to enquire about rooms at Sehnai Resort. Could you share availability and rates?",
};

const DEFAULT_MESSAGE =
  "Hello, I'm interested in Sehnai Resort. Could you share more details?";

export function WhatsAppButton() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const message = MESSAGES[pathname] ?? DEFAULT_MESSAGE;
  const href = siteLinks.whatsapp(message);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.85 }}
      animate={mounted ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed bottom-5 right-5 md:bottom-7 md:right-7 z-[60]"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            key="wa-tooltip"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap pointer-events-none hidden md:block"
          >
            <div
              style={{
                background: "rgba(13, 13, 22, 0.92)",
                border: "1px solid rgba(201, 168, 76, 0.28)",
                padding: "0.65rem 1.05rem",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.7rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: 500,
                color: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
            >
              <span style={{ color: "#C9A84C" }}>Chat</span> on WhatsApp
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Sehnai Resort on WhatsApp"
        data-cursor-hover
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className="relative flex items-center justify-center rounded-full transition-transform duration-300 hover:scale-[1.06] active:scale-100"
        style={{
          width: 60,
          height: 60,
          background:
            "linear-gradient(135deg, #25D366 0%, #1DA851 100%)",
          boxShadow:
            "0 10px 30px rgba(37, 211, 102, 0.32), 0 4px 14px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
        }}
      >
        {/* Soft ping ring */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: "rgba(37, 211, 102, 0.45)",
            animation: "wa-ping 2.6s cubic-bezier(0, 0, 0.2, 1) infinite",
          }}
        />

        {/* Hairline gold accent ring */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: "1px solid rgba(201, 168, 76, 0.35)",
          }}
        />

        {/* WhatsApp glyph */}
        <svg
          viewBox="0 0 32 32"
          width={28}
          height={28}
          fill="#ffffff"
          aria-hidden
          style={{ position: "relative", display: "block" }}
        >
          <path d="M16.003 3C8.82 3 3 8.82 3 16.003c0 2.293.6 4.534 1.745 6.51L3 29l6.66-1.715a13.005 13.005 0 0 0 6.343 1.618h.005C23.183 28.903 29 23.083 29 15.9c0-3.464-1.35-6.72-3.8-9.17A12.94 12.94 0 0 0 16.003 3Zm0 23.85h-.004a10.834 10.834 0 0 1-5.518-1.51l-.396-.235-3.952 1.018 1.054-3.847-.258-.398a10.78 10.78 0 0 1-1.654-5.875c.002-5.97 4.864-10.83 10.84-10.83a10.77 10.77 0 0 1 7.66 3.176 10.737 10.737 0 0 1 3.17 7.66c-.002 5.97-4.864 10.84-10.84 10.84Zm5.94-8.11c-.325-.163-1.927-.952-2.226-1.06-.299-.11-.516-.163-.733.163-.217.326-.84 1.06-1.029 1.277-.19.217-.38.245-.706.082-.325-.163-1.375-.507-2.62-1.617-.968-.864-1.622-1.93-1.812-2.256-.19-.326-.02-.502.143-.665.147-.146.326-.38.49-.57.163-.19.217-.326.326-.543.108-.217.054-.408-.027-.57-.082-.163-.733-1.767-1.005-2.42-.264-.634-.532-.548-.733-.558l-.624-.012a1.2 1.2 0 0 0-.87.408c-.299.326-1.14 1.114-1.14 2.717 0 1.604 1.167 3.153 1.33 3.37.163.217 2.298 3.51 5.567 4.92.779.337 1.387.538 1.86.69.781.249 1.493.213 2.055.13.627-.094 1.927-.788 2.198-1.55.272-.762.272-1.414.19-1.55-.082-.135-.299-.217-.624-.38Z" />
        </svg>
      </a>
    </motion.div>
  );
}
