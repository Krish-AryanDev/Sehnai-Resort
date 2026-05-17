"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { siteLinks } from "@/lib/site-config";

type MessageKey = "default" | "marriageHall" | "restaurant" | "hotel";

const PATH_TO_KEY: Record<string, MessageKey> = {
  "/marriage-hall": "marriageHall",
  "/restaurant": "restaurant",
  "/hotel": "hotel",
};

export function WhatsAppButton() {
  const pathname = usePathname();
  const t = useTranslations("whatsapp");
  const [mounted, setMounted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const messageKey: MessageKey = PATH_TO_KEY[pathname] ?? "default";
  const message = t(`messages.${messageKey}`);
  const href = siteLinks.whatsapp(message);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.85 }}
      animate={mounted ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed bottom-5 right-5 md:bottom-7 md:right-7 z-60"
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
              <span style={{ color: "#C9A84C" }}>{t("tooltipPrefix")}</span>{" "}
              {t("tooltip").replace(t("tooltipPrefix"), "").trim()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("ariaLabel")}
        data-cursor-hover
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className="relative flex items-center justify-center rounded-full transition-transform duration-300 hover:scale-[1.06] active:scale-100"
        style={{
          width: 60,
          height: 60,
          background: "linear-gradient(135deg, #25D366 0%, #1DA851 100%)",
          boxShadow:
            "0 10px 30px rgba(37, 211, 102, 0.32), 0 4px 14px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
        }}
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: "rgba(37, 211, 102, 0.45)",
            animation: "wa-ping 2.6s cubic-bezier(0, 0, 0.2, 1) infinite",
          }}
        />

        <span
          aria-hidden
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: "1px solid rgba(201, 168, 76, 0.35)" }}
        />

        <svg
          viewBox="0 0 32 32"
          width={28}
          height={28}
          fill="#ffffff"
          aria-hidden
          style={{ position: "relative", display: "block" }}
        >
          <path d="M16.003 3C8.82 3 3 8.82 3 16.003c0 2.293.6 4.534 1.745 6.51L3 29l6.66-1.715a13.005 13.005 0 0 0 6.343 1.618h.005C23.183 28.903 29 23.083 29 15.9c0-3.464-1.35-6.72-3.8-9.17A12.94 12.94 0 0 0 16.003 3Zm0 23.85h-.004a10.834 10.834 0 0 1-5.518-1.51l-.396-.235-3.952 1.018 1.054-3.847-.258-.398a10.78 10.78 0 0 1-1.654-5.875c.002-5.97 4.864-10.83 10.84-10.83a10.77 10.77 0 0 1 7.66 3.176 10.737 10.737 0 0 1 3.17 7.66c-.002 5.97-4.864 10.84-10.84 10.84Zm5.94-8.11c-.325-.163-1.927-.952-2.226-1.06-.299-.11-.516-.163-.733.163-.217.326-.84 1.06-1.029 1.277-.19.17-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.16-.47-.28z" />
        </svg>
      </a>
    </motion.div>
  );
}
