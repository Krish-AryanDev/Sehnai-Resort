"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function RoomNotFound() {
  const t = useTranslations("roomDetail");

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "#07070d" }}
    >
      <div className="max-w-md text-center">
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="w-6 h-px bg-[#C9A84C]" />
          <span
            className="text-[#C9A84C] uppercase"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.68rem",
              letterSpacing: "0.3em",
              fontWeight: 500,
            }}
          >
            404
          </span>
          <div className="w-6 h-px bg-[#C9A84C]" />
        </div>

        <h1
          className="text-white font-playfair mb-3"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
            fontWeight: 400,
          }}
        >
          {t("notFoundTitle")}
        </h1>

        <p
          className="text-white/50 mb-8"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "1.05rem",
          }}
        >
          {t("notFoundMessage")}
        </p>

        <Link
          href="/hotel"
          className="btn-premium-outline inline-flex items-center gap-2"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.7rem",
            letterSpacing: "0.22em",
            fontWeight: 600,
            textTransform: "uppercase",
            padding: "0.85rem 1.8rem",
            color: "#C9A84C",
            border: "1px solid rgba(201,168,76,0.35)",
            backgroundColor: "transparent",
          }}
        >
          <ArrowLeft size={12} />
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
