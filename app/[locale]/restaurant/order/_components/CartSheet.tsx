"use client";

import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useCart, type CartItem } from "@/lib/cart-store";
import { VegDot } from "./VegDot";

const INR = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function variantLabel(v: CartItem["variant"]): string {
  if (v === "half") return " — Half";
  if (v === "full") return " — Full";
  return "";
}

export function CartSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { items, totalCount, totalPaise, setQty, removeItem, clear } =
    useCart();

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              zIndex: 60,
            }}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            role="dialog"
            aria-modal="true"
            aria-label="Cart"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 61,
              backgroundColor: "#0d0d16",
              borderTop: "3px solid #C9A84C",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between"
              style={{
                padding: "0.95rem 1.15rem",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={16} style={{ color: "#C9A84C" }} />
                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "#fff",
                    fontSize: "1.1rem",
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  Your cart{" "}
                  <span
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      fontSize: "0.85rem",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                    }}
                  >
                    · {totalCount} {totalCount === 1 ? "item" : "items"}
                  </span>
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close cart"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Lines */}
            <div
              style={{
                overflowY: "auto",
                flex: 1,
                padding: "0.5rem 1.15rem 1rem",
              }}
            >
              {items.length === 0 ? (
                <div
                  style={{
                    padding: "3rem 1rem",
                    textAlign: "center",
                    color: "rgba(255,255,255,0.45)",
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: "italic",
                    fontSize: "1.05rem",
                  }}
                >
                  Your cart is empty. Browse the menu and tap{" "}
                  <strong style={{ color: "#C9A84C" }}>+ Add</strong> on any
                  dish.
                </div>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {items.map((it) => (
                    <li
                      key={`${it.menuItemId}::${it.variant}`}
                      className="flex items-start gap-3"
                      style={{
                        padding: "0.85rem 0",
                        borderBottom: "1px dashed rgba(255,255,255,0.08)",
                      }}
                    >
                      <div style={{ paddingTop: 5 }}>
                        <VegDot veg={it.isVeg} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            color: "#fff",
                            fontSize: "0.98rem",
                            fontWeight: 500,
                            lineHeight: 1.3,
                          }}
                        >
                          {it.name}
                          <span
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: "0.78rem",
                              color: "rgba(255,255,255,0.45)",
                              fontWeight: 400,
                            }}
                          >
                            {variantLabel(it.variant)}
                          </span>
                        </div>
                        <div
                          style={{
                            marginTop: 4,
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "0.78rem",
                            color: "rgba(255,255,255,0.45)",
                          }}
                        >
                          {INR(it.unitPricePaise)} each
                        </div>
                      </div>

                      <div
                        className="flex flex-col items-end gap-2 shrink-0"
                        style={{ minWidth: 92 }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            border: "1.5px solid #C9A84C",
                            backgroundColor: "transparent",
                          }}
                        >
                          <button
                            type="button"
                            aria-label="Decrease"
                            onClick={() =>
                              setQty(it.menuItemId, it.variant, it.qty - 1)
                            }
                            style={{
                              width: 28,
                              height: 28,
                              color: "#C9A84C",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Minus size={12} />
                          </button>
                          <span
                            style={{
                              minWidth: 22,
                              textAlign: "center",
                              fontFamily: "'Inter', sans-serif",
                              fontWeight: 700,
                              fontSize: "0.82rem",
                              color: "#fff",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {it.qty}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase"
                            onClick={() =>
                              setQty(it.menuItemId, it.variant, it.qty + 1)
                            }
                            style={{
                              width: 28,
                              height: 28,
                              color: "#C9A84C",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <div
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            color: "#C9A84C",
                            fontSize: "0.92rem",
                            fontWeight: 600,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {INR(it.unitPricePaise * it.qty)}
                        </div>
                      </div>

                      <button
                        type="button"
                        aria-label={`Remove ${it.name}`}
                        onClick={() => removeItem(it.menuItemId, it.variant)}
                        style={{
                          color: "#E5736D",
                          alignSelf: "center",
                          padding: 4,
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  padding:
                    "1rem 1.15rem calc(1rem + env(safe-area-inset-bottom))",
                  backgroundColor: "#0a0a13",
                }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{ marginBottom: "0.85rem" }}
                >
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.72rem",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.55)",
                      fontWeight: 600,
                    }}
                  >
                    Subtotal
                  </span>
                  <span
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: "#fff",
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {INR(totalPaise)}
                  </span>
                </div>

                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: "italic",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "0.85rem",
                    marginBottom: "0.85rem",
                    textAlign: "center",
                  }}
                >
                  Delivery fees, taxes & fulfillment options at checkout.
                </p>

                <Link
                  href="/restaurant/order/checkout"
                  onClick={onClose}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.95rem",
                    backgroundColor: "#C9A84C",
                    color: "#000",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.75rem",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  Proceed to checkout
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Empty the cart? This can't be undone."
                      )
                    ) {
                      clear();
                    }
                  }}
                  style={{
                    width: "100%",
                    marginTop: "0.55rem",
                    padding: "0.6rem",
                    backgroundColor: "transparent",
                    color: "#E5736D",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.68rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Clear cart
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
