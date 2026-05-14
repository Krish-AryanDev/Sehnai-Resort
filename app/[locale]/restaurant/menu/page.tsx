"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Phone, Leaf } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { FadeIn } from "@/components/FadeIn";
import { Link } from "@/i18n/navigation";
import { siteLinks } from "@/lib/site-config";
import { menuSections, type MenuItem } from "@/lib/menu-data";

/* ---------- Parchment palette ---------- */
const C = {
  bgDeep: "#EFE3C4",         // outermost frame
  bg: "#F5EDD8",             // page background
  surface: "#FDFAF3",        // section surfaces
  card: "#F9F1DC",           // raised card surface
  ink: "#2C1A0E",            // primary text / headings
  inkSoft: "#3D2B1F",        // body
  inkMuted: "#6B5642",       // secondary
  gold: "#B8860B",           // primary accent
  goldDark: "#8B6914",       // hover / underlines
  rule: "#D4C4A0",           // hairline rules & borders
} as const;

const INR = (n: number) => `₹${n}`;

/* ---------- Veg / Non-veg dot ---------- */
function VegDot({ veg }: { veg?: boolean }) {
  const isVeg = veg !== false;
  const stroke = isVeg ? "#3F7D2A" : "#A52A2A";
  return (
    <span
      aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 12,
        height: 12,
        border: `1.5px solid ${stroke}`,
        flexShrink: 0,
        marginTop: 6,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: stroke,
        }}
      />
    </span>
  );
}

/* ---------- Single menu row with dotted leader ---------- */
function MenuRow({ item, twoPrice }: { item: MenuItem; twoPrice: boolean }) {
  return (
    <li className="flex items-start gap-3 py-3" style={{ borderBottom: `1px dashed ${C.rule}` }}>
      <VegDot veg={item.veg} />
      <div className="flex-1 min-w-0 flex items-baseline gap-3">
        <div className="flex-1 min-w-0">
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              color: C.ink,
              fontSize: "1.02rem",
              fontWeight: 500,
              letterSpacing: "0.005em",
            }}
          >
            {item.name}
          </span>
          {item.note && (
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                color: C.inkMuted,
                fontSize: "0.92rem",
                marginLeft: "0.5rem",
              }}
            >
              ({item.note})
            </span>
          )}
        </div>

        {twoPrice ? (
          <div className="flex gap-6 shrink-0" style={{ minWidth: "120px", justifyContent: "flex-end" }}>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                color: C.goldDark,
                fontSize: "0.98rem",
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                minWidth: "44px",
                textAlign: "right",
              }}
            >
              {item.priceHalf ? INR(item.priceHalf) : "—"}
            </span>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                color: C.goldDark,
                fontSize: "0.98rem",
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                minWidth: "44px",
                textAlign: "right",
              }}
            >
              {item.priceFull ? INR(item.priceFull) : "—"}
            </span>
          </div>
        ) : (
          <span
            className="shrink-0"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: C.goldDark,
              fontSize: "1.02rem",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {item.price !== undefined ? INR(item.price) : ""}
          </span>
        )}
      </div>
    </li>
  );
}

/* ---------- Decorative ornament between section header and items ---------- */
function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3 my-5">
      <div className="h-px w-12" style={{ backgroundColor: C.rule }} />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 2 L13.5 9 L20 8 L14.5 12 L20 16 L13.5 15 L12 22 L10.5 15 L4 16 L9.5 12 L4 8 L10.5 9 Z"
          fill={C.gold}
          opacity="0.85"
        />
      </svg>
      <div className="h-px w-12" style={{ backgroundColor: C.rule }} />
    </div>
  );
}

/* =================================================================== */
export default function MenuPage() {
  const t = useTranslations("menu");
  const [activeId, setActiveId] = useState<string>(menuSections[0]?.id ?? "");

  /* Highlight the currently visible section in the sticky tab bar */
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const ids = menuSections.map((s) => s.id);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    observers.push(observer);

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div style={{ backgroundColor: C.bg, color: C.inkSoft }}>
      {/* ============= HERO ============= */}
      <section
        className="relative overflow-hidden flex flex-col"
        style={{
          backgroundColor: C.bg,
          minHeight: "100vh",
          paddingTop: "7rem",
          paddingBottom: "4rem",
          borderBottom: `1px solid ${C.rule}`,
        }}
      >
        {/* subtle paper-texture overlay using two radial gradients */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(184,134,11,0.05) 0%, transparent 45%),
              radial-gradient(circle at 80% 70%, rgba(184,134,11,0.04) 0%, transparent 50%)
            `,
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 md:px-10 w-full flex-1 flex flex-col">
          {/* Back link */}
          <FadeIn>
            <Link
              href="/restaurant"
              className="inline-flex items-center gap-2 mb-10 font-inter group"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.72rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: C.inkMuted,
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform duration-300" />
              {t("back")}
            </Link>
          </FadeIn>

          <div className="text-center flex-1 flex flex-col">
            {/* Title block — grows to fill available space, content centered within */}
            <div className="flex-1 flex flex-col items-center justify-center">

            <FadeIn delay={0.05}>
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="h-px w-10" style={{ backgroundColor: C.gold }} />
                <span
                  className="font-inter uppercase"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.7rem",
                    letterSpacing: "0.4em",
                    color: C.gold,
                    fontWeight: 600,
                  }}
                >
                  {t("eyebrow")}
                </span>
                <div className="h-px w-10" style={{ backgroundColor: C.gold }} />
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1
                className="font-playfair"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: C.ink,
                  fontSize: "clamp(2.8rem, 6vw, 4.6rem)",
                  fontWeight: 400,
                  lineHeight: 1.05,
                  letterSpacing: "-0.01em",
                }}
              >
                {t("title")}
              </h1>
            </FadeIn>

            <FadeIn delay={0.15}>
              <p
                className="mt-4 mx-auto font-cormorant italic"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: C.inkMuted,
                  fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
                  fontWeight: 400,
                  maxWidth: "640px",
                  lineHeight: 1.55,
                }}
              >
                {t("subtitle")}
              </p>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="mt-10 flex items-center justify-center">
                <Ornament />
              </div>
            </FadeIn>

            </div>
            {/* /Title block */}

            {/* Veg / Non-veg legend — pinned to the bottom of the hero */}
            <FadeIn delay={0.25} className="pt-16 md:pt-24">
              <div
                className="inline-flex items-center gap-6 px-6 py-3"
                style={{
                  border: `1px solid ${C.rule}`,
                  backgroundColor: C.surface,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <VegDot veg={true} />
                  <span
                    className="font-inter"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.7rem",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: C.inkMuted,
                      fontWeight: 500,
                    }}
                  >
                    {t("legend.veg")}
                  </span>
                </div>
                <div className="h-4 w-px" style={{ backgroundColor: C.rule }} />
                <div className="flex items-center gap-2.5">
                  <VegDot veg={false} />
                  <span
                    className="font-inter"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.7rem",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: C.inkMuted,
                      fontWeight: 500,
                    }}
                  >
                    {t("legend.nonVeg")}
                  </span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ============= STICKY CATEGORY NAV ============= */}
      <nav
        className="sticky z-30"
        style={{
          top: 0,
          backgroundColor: `${C.surface}f2`,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: `1px solid ${C.rule}`,
        }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-10">
          <ul
            className="flex gap-1 overflow-x-auto py-2.5"
            style={{ scrollbarWidth: "thin", scrollbarColor: `${C.rule} transparent` }}
          >
            {menuSections.map((s) => {
              const active = activeId === s.id;
              return (
                <li key={s.id} className="shrink-0">
                  <a
                    href={`#${s.id}`}
                    className="block px-4 py-2 transition-colors duration-300"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.7rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      color: active ? C.goldDark : C.inkMuted,
                      borderBottom: active ? `2px solid ${C.gold}` : "2px solid transparent",
                      whiteSpace: "nowrap",
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

      {/* ============= MENU SECTIONS ============= */}
      <section className="py-16 md:py-20" style={{ backgroundColor: C.bg }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          {menuSections.map((section, sectionIdx) => {
            const twoPrice = section.items.some(
              (i) => i.priceHalf !== undefined || i.priceFull !== undefined
            );

            return (
              <motion.div
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  scrollMarginTop: "80px",
                  marginBottom: sectionIdx === menuSections.length - 1 ? 0 : "4.5rem",
                }}
              >
                {/* Section header */}
                <div className="text-center mb-2">
                  <h2
                    className="font-playfair"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: C.ink,
                      fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                      fontWeight: 500,
                      letterSpacing: "0.005em",
                    }}
                  >
                    {section.title}
                  </h2>
                  {section.subtitle && (
                    <p
                      className="mt-1"
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontStyle: "italic",
                        color: C.inkMuted,
                        fontSize: "1.05rem",
                        fontWeight: 400,
                      }}
                    >
                      {section.subtitle}
                    </p>
                  )}
                </div>
                <Ornament />

                {/* Half/Full label row, only when applicable */}
                {twoPrice && (
                  <div
                    className="flex items-baseline gap-3 pb-2 mb-1"
                    style={{ borderBottom: `1px solid ${C.rule}` }}
                  >
                    <div style={{ width: 12 }} />
                    <div className="flex-1" />
                    <div className="flex gap-6 shrink-0" style={{ minWidth: "120px", justifyContent: "flex-end" }}>
                      <span
                        className="font-inter"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "0.65rem",
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          color: C.inkMuted,
                          fontWeight: 600,
                          minWidth: "44px",
                          textAlign: "right",
                        }}
                      >
                        {t("half")}
                      </span>
                      <span
                        className="font-inter"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "0.65rem",
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          color: C.inkMuted,
                          fontWeight: 600,
                          minWidth: "44px",
                          textAlign: "right",
                        }}
                      >
                        {t("full")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Items — two columns on desktop, single on mobile */}
                <ul
                  className="grid grid-cols-1 md:grid-cols-2 md:gap-x-12"
                  style={{ listStyle: "none", padding: 0, margin: 0 }}
                >
                  {section.items.map((item) => (
                    <MenuRow key={`${section.id}-${item.name}`} item={item} twoPrice={twoPrice} />
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ============= FOOTER NOTE + CTA ============= */}
      <section
        className="py-16 md:py-20"
        style={{
          backgroundColor: C.surface,
          borderTop: `1px solid ${C.rule}`,
        }}
      >
        <div className="max-w-3xl mx-auto px-6 md:px-10 text-center">
          <FadeIn>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Leaf size={14} style={{ color: C.gold }} />
              <span
                className="font-inter"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.7rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: C.gold,
                  fontWeight: 600,
                }}
              >
                {t("footerNote.eyebrow")}
              </span>
            </div>
            <p
              className="font-cormorant italic"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: C.inkSoft,
                fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
                lineHeight: 1.7,
                fontWeight: 400,
              }}
            >
              {t("footerNote.body")}
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <a
                href={siteLinks.tel}
                className="btn-premium flex items-center gap-3 font-inter"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.72rem",
                  letterSpacing: "0.22em",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  padding: "0.95rem 2.2rem",
                  backgroundColor: C.ink,
                  color: C.bg,
                }}
              >
                <Phone size={13} />
                {t("cta.reserve")}
              </a>
              <Link
                href="/restaurant"
                className="btn-premium-outline flex items-center gap-3 font-inter"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.72rem",
                  letterSpacing: "0.22em",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  padding: "0.9rem 2.2rem",
                  border: `1px solid ${C.ink}`,
                  color: C.ink,
                  backgroundColor: "transparent",
                }}
              >
                {t("cta.back")}
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
