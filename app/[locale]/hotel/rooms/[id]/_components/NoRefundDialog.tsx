"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";

type NoRefundDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/**
 * Pre-payment warning modal — explicitly tells the guest the booking is
 * non-refundable before they reach the (future) payment gateway.
 *
 * Closes on:
 *  - Esc key
 *  - Overlay click
 *  - Cancel button
 *
 * Focus management: traps focus inside the dialog while open.
 */
export function NoRefundDialog({
  open,
  onClose,
  onConfirm,
}: NoRefundDialogProps) {
  const t = useTranslations("roomDetail.noRefund");
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Close on Esc + lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus to the confirm button on open
    confirmBtnRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="no-refund-title"
        >
          {/* overlay */}
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          />

          {/* dialog body */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative w-full max-w-md p-6 sm:p-7 md:p-9"
            style={{
              backgroundColor: "#0d0d16",
              border: "1px solid rgba(201,168,76,0.35)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.12)",
            }}
          >
            {/* close icon (top-right) */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 p-1"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-4 mb-5">
              <div
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  border: "1px solid rgba(201,168,76,0.4)",
                }}
              >
                <AlertTriangle size={20} className="text-[#C9A84C]" />
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  id="no-refund-title"
                  className="text-white font-playfair mb-1"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.3rem",
                    fontWeight: 500,
                    lineHeight: 1.2,
                  }}
                >
                  {t("title")}
                </h3>
                <div
                  className="h-px w-8"
                  style={{ backgroundColor: "#C9A84C", opacity: 0.6 }}
                />
              </div>
            </div>

            <p
              className="text-white/60 mb-7"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.88rem",
                lineHeight: 1.75,
                fontWeight: 300,
              }}
            >
              {t("body")}
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn-premium-outline"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.68rem",
                  letterSpacing: "0.2em",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  padding: "0.85rem 1.6rem",
                  backgroundColor: "transparent",
                  color: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
              >
                {t("cancel")}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={onConfirm}
                className="btn-premium"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.68rem",
                  letterSpacing: "0.2em",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  padding: "0.85rem 1.6rem",
                  backgroundColor: "#C9A84C",
                  color: "#000",
                  border: "none",
                }}
              >
                {t("confirm")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
