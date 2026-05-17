"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CartProvider } from "@/lib/cart-store";
import { MenuItemCard, type MenuItemCardData } from "./_components/MenuItemCard";
import { FilterBar, type FilterState } from "./_components/FilterBar";
import { FloatingCartBar } from "./_components/FloatingCartBar";
import { CartSheet } from "./_components/CartSheet";

export type OrderSection = {
  id: string;
  title: string;
  subtitle: string | null;
  items: MenuItemCardData[];
};

export default function OrderClient({
  sections,
}: {
  sections: OrderSection[];
}) {
  return (
    <CartProvider>
      <OrderShell sections={sections} />
    </CartProvider>
  );
}

function OrderShell({ sections }: { sections: OrderSection[] }) {
  const [filter, setFilter] = useState<FilterState>({
    query: "",
    vegOnly: false,
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");

  // Apply filter
  const filtered = useMemo(() => {
    const q = filter.query.trim().toLowerCase();
    return sections
      .map((s) => ({
        ...s,
        items: s.items.filter((i) => {
          if (filter.vegOnly && !i.isVeg) return false;
          if (q && !i.name.toLowerCase().includes(q)) {
            const desc = (i.description ?? "").toLowerCase();
            if (!desc.includes(q)) return false;
          }
          return true;
        }),
      }))
      .filter((s) => s.items.length > 0);
  }, [sections, filter]);

  // Highlight active section in the sticky nav.
  useEffect(() => {
    const ids = filtered.map((s) => s.id);
    if (ids.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(`order-section-${id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [filtered]);

  const totalItemCount = sections.reduce((s, sec) => s + sec.items.length, 0);

  return (
    <div style={{ backgroundColor: "#07070d", minHeight: "100vh" }}>
      {/* ============= HEADER ============= */}
      <section
        style={{
          backgroundColor: "#0d0d16",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "6rem",
          paddingBottom: "1.5rem",
        }}
      >
        <div
          className="max-w-6xl mx-auto"
          style={{ padding: "0 1.25rem" }}
        >
          <Link
            href="/restaurant"
            className="inline-flex items-center gap-2 group"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.7rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              fontWeight: 500,
              marginBottom: "1.5rem",
            }}
          >
            <ArrowLeft
              size={13}
              className="group-hover:-translate-x-1 transition-transform duration-300"
            />
            Back to restaurant
          </Link>

          <div
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
            style={{ marginBottom: "1.25rem" }}
          >
            <div>
              <div
                className="flex items-center gap-3"
                style={{ marginBottom: "0.5rem" }}
              >
                <div
                  className="h-px"
                  style={{ width: 24, backgroundColor: "#C9A84C" }}
                />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.68rem",
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "#C9A84C",
                    fontWeight: 600,
                  }}
                >
                  Order Online
                </span>
              </div>
              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: "#fff",
                  fontSize: "clamp(1.9rem, 4vw, 2.6rem)",
                  fontWeight: 400,
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                Order from our kitchen
              </h1>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "1.05rem",
                  marginTop: "0.4rem",
                }}
              >
                {totalItemCount} dishes · in-room dining, takeaway or delivery.
              </p>
            </div>
          </div>

          <FilterBar state={filter} onChange={setFilter} />
        </div>
      </section>

      {/* ============= STICKY CATEGORY NAV ============= */}
      {filtered.length > 0 && (
        <nav
          className="sticky z-30"
          style={{
            top: 0,
            backgroundColor: "rgba(13,13,22,0.92)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            className="max-w-6xl mx-auto"
            style={{ padding: "0 0.5rem" }}
          >
            <ul
              className="flex gap-1 overflow-x-auto"
              style={{
                padding: "0.5rem 0.25rem",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(201,168,76,0.3) transparent",
                listStyle: "none",
                margin: 0,
              }}
            >
              {filtered.map((s) => {
                const active = activeId === s.id;
                return (
                  <li key={s.id} className="shrink-0">
                    <a
                      href={`#order-section-${s.id}`}
                      style={{
                        display: "block",
                        padding: "0.45rem 0.85rem",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.7rem",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        color: active ? "#C9A84C" : "rgba(255,255,255,0.45)",
                        borderBottom: active
                          ? "2px solid #C9A84C"
                          : "2px solid transparent",
                        whiteSpace: "nowrap",
                        transition: "color 0.2s",
                      }}
                    >
                      {s.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      )}

      {/* ============= SECTIONS ============= */}
      <section
        style={{
          padding: "1.5rem 1.25rem 8rem",
          backgroundColor: "#07070d",
        }}
      >
        <div className="max-w-6xl mx-auto">
          {filtered.length === 0 ? (
            <EmptyState
              hasItems={totalItemCount > 0}
              onReset={() => setFilter({ query: "", vegOnly: false })}
            />
          ) : (
            filtered.map((section) => (
              <div
                key={section.id}
                id={`order-section-${section.id}`}
                style={{
                  marginBottom: "2.5rem",
                  scrollMarginTop: 72,
                }}
              >
                <div style={{ marginBottom: "1rem" }}>
                  <h2
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: "#fff",
                      fontSize: "clamp(1.3rem, 2.5vw, 1.65rem)",
                      fontWeight: 500,
                      margin: 0,
                    }}
                  >
                    {section.title}
                  </h2>
                  {section.subtitle && (
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontStyle: "italic",
                        color: "rgba(255,255,255,0.45)",
                        fontSize: "1rem",
                        marginTop: 2,
                      }}
                    >
                      {section.subtitle}
                    </p>
                  )}
                </div>
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(240px, 1fr))",
                  }}
                >
                  {section.items.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <FloatingCartBar onOpen={() => setCartOpen(true)} />
      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

function EmptyState({
  hasItems,
  onReset,
}: {
  hasItems: boolean;
  onReset: () => void;
}) {
  return (
    <div
      style={{
        padding: "4rem 1rem",
        textAlign: "center",
        color: "rgba(255,255,255,0.45)",
        fontFamily: "'Cormorant Garamond', serif",
        fontStyle: "italic",
        fontSize: "1.15rem",
      }}
    >
      {hasItems ? (
        <>
          <p style={{ marginBottom: "1rem" }}>
            No dishes match your filters.
          </p>
          <button
            type="button"
            onClick={onReset}
            style={{
              padding: "0.6rem 1.2rem",
              backgroundColor: "#C9A84C",
              color: "#000",
              fontFamily: "'Inter', sans-serif",
              fontStyle: "normal",
              fontSize: "0.7rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear filters
          </button>
        </>
      ) : (
        <p>
          Our menu is being prepared. Please check back shortly or call us to
          order.
        </p>
      )}
    </div>
  );
}
