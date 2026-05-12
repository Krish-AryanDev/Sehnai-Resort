"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { siteLinks } from "@/lib/site-config";
import { LanguageToggle } from "./LanguageToggle";

type NavHref = "/" | "/marriage-hall" | "/restaurant" | "/hotel";

const navLinks: { labelKey: "home" | "marriageHall" | "restaurant" | "hotel"; href: NavHref }[] = [
  { labelKey: "home", href: "/" },
  { labelKey: "marriageHall", href: "/marriage-hall" },
  { labelKey: "restaurant", href: "/restaurant" },
  { labelKey: "hotel", href: "/hotel" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("nav");

  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const transparent = isHome && !scrolled && !mobileOpen;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        backgroundColor: transparent ? "transparent" : "rgba(8, 8, 14, 0.97)",
        backdropFilter: transparent ? "none" : "blur(12px)",
        boxShadow: transparent ? "none" : "0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between"
        style={{ height: "72px" }}
      >
        {/* Logo */}
        <Link href="/" className="flex flex-col leading-none shrink-0">
          <span
            className="text-[#C9A84C] font-inter"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.45em",
              fontWeight: 500,
              lineHeight: 1,
              marginBottom: "3px",
            }}
          >
            THE
          </span>
          <span
            className="text-white font-playfair"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.2rem",
              fontWeight: 600,
              letterSpacing: "0.15em",
              lineHeight: 1,
            }}
          >
            SHEHNAI RESORT
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative font-inter transition-colors duration-300"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.78rem",
                  letterSpacing: "0.08em",
                  fontWeight: 400,
                  color: active ? "#C9A84C" : "rgba(255,255,255,0.75)",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.target as HTMLElement).style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.target as HTMLElement).style.color = "rgba(255,255,255,0.75)";
                }}
              >
                {t(link.labelKey)}
                {active && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-px bg-[#C9A84C]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right side: Language toggle + CTA + Mobile Toggle */}
        <div className="flex items-center gap-3 md:gap-5">
          <div className="hidden md:block">
            <LanguageToggle />
          </div>

          <a
            href={siteLinks.tel}
            className="btn-premium-outline hidden md:flex items-center gap-2 font-inter border"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.72rem",
              letterSpacing: "0.18em",
              fontWeight: 500,
              color: "#C9A84C",
              borderColor: "#C9A84C",
              padding: "0.55rem 1.4rem",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#C9A84C";
              (e.currentTarget as HTMLElement).style.color = "#000";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#C9A84C";
            }}
          >
            <Phone size={12} />
            {t("bookNow")}
          </a>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden text-white p-1"
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={22} />
                </motion.span>
              ) : (
                <motion.span
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={22} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden"
            style={{
              backgroundColor: "rgba(8, 8, 14, 0.98)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="px-6 py-6 flex flex-col gap-1">
              {navLinks.map((link, i) => {
                const active = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.3 }}
                  >
                    <Link
                      href={link.href}
                      className="flex items-center justify-between py-4 font-inter"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.9rem",
                        letterSpacing: "0.08em",
                        color: active ? "#C9A84C" : "rgba(255,255,255,0.75)",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {t(link.labelKey)}
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />}
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28 }}
                className="pt-5 flex items-center justify-between"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "1rem" }}
              >
                <span
                  className="font-inter uppercase"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.7rem",
                    letterSpacing: "0.25em",
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 500,
                  }}
                >
                  Language
                </span>
                <LanguageToggle compact />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.34 }}
                className="pt-4"
              >
                <a
                  href={siteLinks.tel}
                  className="flex items-center gap-2 text-[#C9A84C] font-inter"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.85rem",
                    letterSpacing: "0.1em",
                  }}
                >
                  <Phone size={14} />
                  {t("callToBook")}
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
