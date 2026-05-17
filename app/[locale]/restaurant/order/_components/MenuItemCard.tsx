"use client";

import { useState } from "react";
import { Image as ImageIcon, Minus, Plus, X } from "lucide-react";
import { useCart, type CartVariant } from "@/lib/cart-store";
import { VegDot } from "./VegDot";

export type MenuItemCardData = {
  id: string;
  name: string;
  description: string | null;
  priceSinglePaise: number | null;
  priceHalfPaise: number | null;
  priceFullPaise: number | null;
  note: string | null;
  isVeg: boolean;
  imageUrl: string | null;
  isAvailable: boolean;
};

const INR = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

type Variant = { key: CartVariant; label: string; pricePaise: number };

function variantsOf(item: MenuItemCardData): Variant[] {
  if (item.priceSinglePaise != null) {
    return [{ key: "single", label: "", pricePaise: item.priceSinglePaise }];
  }
  const out: Variant[] = [];
  if (item.priceHalfPaise != null) {
    out.push({ key: "half", label: "Half", pricePaise: item.priceHalfPaise });
  }
  if (item.priceFullPaise != null) {
    out.push({ key: "full", label: "Full", pricePaise: item.priceFullPaise });
  }
  return out;
}

function startingPriceLabel(variants: Variant[]): string {
  if (variants.length === 0) return "—";
  if (variants.length === 1) return INR(variants[0].pricePaise);
  const min = Math.min(...variants.map((v) => v.pricePaise));
  return `From ${INR(min)}`;
}

export function MenuItemCard({ item }: { item: MenuItemCardData }) {
  const cart = useCart();
  const variants = variantsOf(item);
  const isSingle = variants.length === 1;
  const [showVariantPicker, setShowVariantPicker] = useState(false);

  const singleQty = isSingle ? cart.qtyOf(item.id, variants[0].key) : 0;
  const multiQty = isSingle
    ? 0
    : variants.reduce((s, v) => s + cart.qtyOf(item.id, v.key), 0);

  function add(variant: Variant) {
    cart.addItem({
      menuItemId: item.id,
      variant: variant.key,
      qty: 1,
      name: item.name,
      unitPricePaise: variant.pricePaise,
      imageUrl: item.imageUrl,
      isVeg: item.isVeg,
    });
  }

  /** Add control reused by both layouts. Returns null when unavailable. */
  function renderAddControl(compact: boolean) {
    if (!item.isAvailable) return null;
    const styles = compact ? compactStyles : largeStyles;

    if (isSingle) {
      if (singleQty === 0) {
        return (
          <button
            type="button"
            onClick={() => add(variants[0])}
            style={styles.addBtn}
          >
            <Plus size={compact ? 12 : 14} /> Add
          </button>
        );
      }
      return (
        <div style={styles.stepperWrap}>
          <button
            type="button"
            aria-label="Decrease"
            onClick={() =>
              cart.setQty(item.id, variants[0].key, singleQty - 1)
            }
            style={styles.stepperBtn}
          >
            <Minus size={compact ? 11 : 13} />
          </button>
          <span style={styles.stepperQty}>{singleQty}</span>
          <button
            type="button"
            aria-label="Increase"
            onClick={() =>
              cart.setQty(item.id, variants[0].key, singleQty + 1)
            }
            style={styles.stepperBtn}
          >
            <Plus size={compact ? 11 : 13} />
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setShowVariantPicker(true)}
        style={styles.addBtn}
      >
        {multiQty > 0 ? (
          <>
            <span>{multiQty} added</span>
            <Plus size={compact ? 12 : 14} />
          </>
        ) : (
          <>
            <Plus size={compact ? 12 : 14} /> Add
          </>
        )}
      </button>
    );
  }

  return (
    <>
      {/* =========================================================
          MOBILE: Zomato-style horizontal row
          Image left · name/desc middle · price + ADD stacked right
          ========================================================= */}
      <div
        className="md:hidden flex"
        style={{
          gap: 12,
          padding: 12,
          backgroundColor: "#0a0a13",
          border: "1px solid rgba(255,255,255,0.05)",
          opacity: item.isAvailable ? 1 : 0.55,
        }}
      >
        {/* Thumb */}
        <div
          style={{
            position: "relative",
            width: 96,
            height: 96,
            flexShrink: 0,
            backgroundColor: "#0d0d16",
            overflow: "hidden",
          }}
        >
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt={item.name}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: item.isAvailable ? "none" : "grayscale(0.6)",
              }}
            />
          ) : (
            <div
              aria-hidden
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#C9A84C",
                opacity: 0.35,
              }}
            >
              <ImageIcon size={22} />
            </div>
          )}
        </div>

        {/* Middle: name, note, description */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 6,
            }}
          >
            <div style={{ paddingTop: 4 }}>
              <VegDot veg={item.isVeg} size={11} />
            </div>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#fff",
                fontSize: "0.95rem",
                fontWeight: 500,
                lineHeight: 1.25,
                margin: 0,
                wordBreak: "break-word",
              }}
            >
              {item.name}
              {item.note && (
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: "italic",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "0.82rem",
                    fontWeight: 400,
                    marginLeft: 6,
                  }}
                >
                  ({item.note})
                </span>
              )}
            </h3>
          </div>
          {item.description && (
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.74rem",
                color: "rgba(255,255,255,0.45)",
                margin: 0,
                lineHeight: 1.45,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.description}
            </p>
          )}
          {!item.isAvailable && (
            <span
              style={{
                marginTop: 2,
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.6rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#C9A84C",
                fontWeight: 600,
              }}
            >
              Unavailable
            </span>
          )}
        </div>

        {/* Right: price (top) + Add (bottom) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexShrink: 0,
            minWidth: 78,
            gap: 8,
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "0.95rem",
              color: "#C9A84C",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
              textAlign: "right",
            }}
          >
            {startingPriceLabel(variants)}
          </div>
          {renderAddControl(true)}
        </div>
      </div>

      {/* =========================================================
          DESKTOP: image-forward card
          ========================================================= */}
      <div
        className="hidden md:flex"
        style={{
          backgroundColor: "#0a0a13",
          border: "1px solid rgba(255,255,255,0.05)",
          flexDirection: "column",
          opacity: item.isAvailable ? 1 : 0.5,
        }}
      >
        {/* ---- Image ---- */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4 / 3",
            backgroundColor: "#0d0d16",
            overflow: "hidden",
          }}
        >
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt={item.name}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: item.isAvailable ? "none" : "grayscale(0.6)",
              }}
            />
          ) : (
            <div
              aria-hidden
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#C9A84C",
                opacity: 0.35,
              }}
            >
              <ImageIcon size={32} />
            </div>
          )}

          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              backgroundColor: "rgba(7,7,13,0.85)",
              padding: 4,
              display: "inline-flex",
            }}
          >
            <VegDot veg={item.isVeg} />
          </div>

          {!item.isAvailable && (
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                backgroundColor: "rgba(7,7,13,0.92)",
                color: "#C9A84C",
                padding: "0.25rem 0.55rem",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.6rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 600,
                border: "1px solid rgba(201,168,76,0.4)",
              }}
            >
              Unavailable
            </div>
          )}

          <div
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
            }}
          >
            {renderAddControl(false)}
          </div>
        </div>

        {/* ---- Body ---- */}
        <div style={{ padding: "0.85rem 1rem 1rem", flex: 1 }}>
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#fff",
              fontSize: "1.02rem",
              fontWeight: 500,
              lineHeight: 1.25,
              margin: 0,
            }}
          >
            {item.name}
          </h3>
          {item.note && (
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                color: "rgba(255,255,255,0.4)",
                fontSize: "0.85rem",
                margin: "0.15rem 0 0",
              }}
            >
              ({item.note})
            </p>
          )}
          {item.description && (
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.45)",
                margin: "0.45rem 0 0",
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.description}
            </p>
          )}
          <div
            style={{
              marginTop: "0.65rem",
              fontFamily: "'Playfair Display', serif",
              fontSize: "0.98rem",
              color: "#C9A84C",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {startingPriceLabel(variants)}
          </div>
        </div>
      </div>

      {showVariantPicker && (
        <VariantPicker
          item={item}
          variants={variants}
          onClose={() => setShowVariantPicker(false)}
          onAdd={(v) => add(v)}
        />
      )}
    </>
  );
}

/* ===================================================================
 * Add-button & stepper styles — two sizes:
 *   compact = mobile row,  large = desktop image overlay
 * =================================================================== */

const largeStyles = {
  addBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#C9A84C",
    border: "1.5px solid #C9A84C",
    color: "#000",
    padding: "0.45rem 0.85rem",
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.7rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
  } as React.CSSProperties,
  stepperWrap: {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "#C9A84C",
    border: "1.5px solid #C9A84C",
    boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
  } as React.CSSProperties,
  stepperBtn: {
    width: 30,
    height: 30,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#000",
    cursor: "pointer",
  } as React.CSSProperties,
  stepperQty: {
    minWidth: 22,
    textAlign: "center",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 700,
    fontSize: "0.85rem",
    color: "#000",
    fontVariantNumeric: "tabular-nums",
  } as React.CSSProperties,
} as const;

const compactStyles = {
  addBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#C9A84C",
    border: "1.5px solid #C9A84C",
    color: "#000",
    padding: "0.35rem 0.6rem",
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.62rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontWeight: 700,
    cursor: "pointer",
  } as React.CSSProperties,
  stepperWrap: {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "#C9A84C",
    border: "1.5px solid #C9A84C",
  } as React.CSSProperties,
  stepperBtn: {
    width: 24,
    height: 24,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#000",
    cursor: "pointer",
  } as React.CSSProperties,
  stepperQty: {
    minWidth: 18,
    textAlign: "center",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 700,
    fontSize: "0.78rem",
    color: "#000",
    fontVariantNumeric: "tabular-nums",
  } as React.CSSProperties,
} as const;

/* ---- Variant picker modal — used for items with Half + Full ---- */
function VariantPicker({
  item,
  variants,
  onClose,
  onAdd,
}: {
  item: MenuItemCardData;
  variants: Variant[];
  onClose: () => void;
  onAdd: (v: Variant) => void;
}) {
  const cart = useCart();
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#0d0d16",
          width: "100%",
          maxWidth: 480,
          padding: "1.25rem 1.25rem 1.5rem",
          borderTop: "3px solid #C9A84C",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h4
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#fff",
              fontSize: "1.1rem",
              fontWeight: 500,
              margin: 0,
            }}
          >
            Choose portion — {item.name}
          </h4>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            <X size={18} />
          </button>
        </div>

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {variants.map((v) => {
            const qty = cart.qtyOf(item.id, v.key);
            return (
              <li
                key={v.key}
                className="flex items-center justify-between"
                style={{
                  padding: "0.7rem 0",
                  borderBottom: "1px dashed rgba(255,255,255,0.08)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#fff",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {v.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: "#C9A84C",
                      fontSize: "0.92rem",
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    {INR(v.pricePaise)}
                  </div>
                </div>
                {qty === 0 ? (
                  <button
                    type="button"
                    onClick={() => onAdd(v)}
                    style={{ ...largeStyles.addBtn, boxShadow: "none" }}
                  >
                    <Plus size={14} /> Add
                  </button>
                ) : (
                  <div
                    style={{ ...largeStyles.stepperWrap, boxShadow: "none" }}
                  >
                    <button
                      type="button"
                      aria-label="Decrease"
                      onClick={() => cart.setQty(item.id, v.key, qty - 1)}
                      style={largeStyles.stepperBtn}
                    >
                      <Minus size={13} />
                    </button>
                    <span style={largeStyles.stepperQty}>{qty}</span>
                    <button
                      type="button"
                      aria-label="Increase"
                      onClick={() => cart.setQty(item.id, v.key, qty + 1)}
                      style={largeStyles.stepperBtn}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: "1rem",
            width: "100%",
            padding: "0.8rem",
            backgroundColor: "#C9A84C",
            color: "#000",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.72rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
