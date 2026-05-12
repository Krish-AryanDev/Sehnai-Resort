"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("languageToggle");
  const [pending, startTransition] = useTransition();

  const nextLocale: Locale = locale === "en" ? "hi" : "en";
  const label = nextLocale === "hi" ? t("switchToHindi") : t("switchToEnglish");

  const switchLocale = () => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <button
      onClick={switchLocale}
      disabled={pending}
      aria-label={t("ariaLabel")}
      className="font-inter transition-colors duration-300 hover:text-[#C9A84C]"
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: compact ? "0.78rem" : "0.72rem",
        letterSpacing: "0.18em",
        fontWeight: 500,
        color: "rgba(255,255,255,0.75)",
        background: "none",
        border: "none",
        padding: compact ? "0" : "0.45rem 0.75rem",
        cursor: "pointer",
        textTransform: "uppercase",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );
}
