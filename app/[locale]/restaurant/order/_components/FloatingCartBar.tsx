"use client";

import { ShoppingBag, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "@/lib/cart-store";

const INR = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export function FloatingCartBar({ onOpen }: { onOpen: () => void }) {
  const { totalCount, totalPaise, hydrated } = useCart();
  const visible = hydrated && totalCount > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            padding:
              "0.75rem 0.75rem calc(0.75rem + env(safe-area-inset-bottom))",
          }}
        >
          <button
            type="button"
            onClick={onOpen}
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
              padding: "0.85rem 1.1rem",
              backgroundColor: "#C9A84C",
              color: "#000",
              minWidth: 280,
              maxWidth: 560,
              width: "100%",
              boxShadow: "0 12px 32px rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                backgroundColor: "#07070d",
                color: "#C9A84C",
                flexShrink: 0,
              }}
            >
              <ShoppingBag size={15} />
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                lineHeight: 1.15,
                flex: 1,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: "rgba(0,0,0,0.7)",
                }}
              >
                {totalCount} {totalCount === 1 ? "item" : "items"} ·{" "}
                {INR(totalPaise)}
              </span>
              <span
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  marginTop: 2,
                  letterSpacing: "0.02em",
                }}
              >
                View cart
              </span>
            </div>
            <ChevronRight size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
