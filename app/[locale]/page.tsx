"use client";

import { motion } from "motion/react";
import { ArrowRight, Star, Users, UtensilsCrossed, BedDouble } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { HeroSlider } from "@/components/HeroSlider";
import { FadeIn } from "@/components/FadeIn";
import { SmartImage } from "@/components/SmartImage";
import { siteLinks } from "@/lib/site-config";

const serviceKeys = ["marriageHall", "restaurant", "hotel"] as const;

const serviceMeta: Record<
  (typeof serviceKeys)[number],
  { path: "/marriage-hall" | "/restaurant" | "/hotel"; image: string }
> = {
  marriageHall: {
    path: "/marriage-hall",
    image:
      "https://images.unsplash.com/photo-1759519238029-689e99c6d19e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwY2VyZW1vbnklMjBmbG9yYWwlMjBkZWNvcmF0aW9uJTIwYmFsbHJvb218ZW58MXx8fHwxNzc4NTIxNzA0fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  restaurant: {
    path: "/restaurant",
    image:
      "https://images.unsplash.com/photo-1750943024048-a4c9912b1425?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwZm9vZCUyMHBsYXRpbmclMjBlbGVnYW50JTIwZGlzaHxlbnwxfHx8fDE3Nzg1MjE3MDR8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  hotel: {
    path: "/hotel",
    image:
      "https://images.unsplash.com/photo-1771206331424-44b8ec9acdf4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGxvYmJ5JTIwcHJlbWl1bSUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3Nzg1MjE3MDV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
};

export default function HomePage() {
  const router = useRouter();
  const tHome = useTranslations("home");
  const tServices = useTranslations("home.services");

  const stats: { icon: typeof Star; value: string; labelKey: string }[] = [
    { icon: Star, value: "3+", labelKey: "yearsLabel" },
    { icon: Users, value: "200+", labelKey: "celebrationsLabel" },
    { icon: UtensilsCrossed, value: "50+", labelKey: "menuLabel" },
    { icon: BedDouble, value: "12", labelKey: "roomsLabel" },
  ];

  return (
    <div style={{ backgroundColor: "#07070d" }}>
      <HeroSlider />

      <section className="py-24 md:py-32 px-6 md:px-10" style={{ backgroundColor: "#07070d" }}>
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-8 h-px bg-[#C9A84C]" />
              <span
                className="text-[#C9A84C] font-inter uppercase"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", letterSpacing: "0.35em", fontWeight: 500 }}
              >
                {tHome("welcome.eyebrow")}
              </span>
              <div className="w-8 h-px bg-[#C9A84C]" />
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h2
              className="text-white font-playfair mb-6"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 400, lineHeight: 1.25, letterSpacing: "-0.01em" }}
            >
              {tHome("welcome.heading")}{" "}
              <span className="italic text-[#C9A84C]">{tHome("welcome.headingAccent")}</span>
            </h2>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p
              className="text-white/50 font-inter"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(0.9rem, 1.5vw, 1.05rem)", lineHeight: 1.85, fontWeight: 300, maxWidth: "600px", margin: "0 auto" }}
            >
              {tHome("welcome.subtext")}
            </p>
          </FadeIn>
        </div>
      </section>

      <section style={{ backgroundColor: "#0e0e18", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ icon: Icon, value, labelKey }, i) => (
              <FadeIn key={labelKey} delay={i * 0.08}>
                <div className="flex flex-col items-center text-center gap-3">
                  <Icon size={22} className="text-[#C9A84C]" />
                  <span
                    className="text-white font-playfair"
                    style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 400, lineHeight: 1 }}
                  >
                    {value}
                  </span>
                  <span
                    className="text-white/35 font-inter uppercase"
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.65rem", letterSpacing: "0.2em", fontWeight: 500 }}
                  >
                    {tHome(`stats.${labelKey}` as "stats.yearsLabel")}
                  </span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-4" style={{ backgroundColor: "#07070d" }}>
        {serviceKeys.map((key, index) => {
          const isEven = index % 2 === 0;
          const { path, image } = serviceMeta[key];
          const features = tServices.raw(`${key}.features`) as string[];

          return (
            <div
              key={path}
              className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24"
              style={{ borderBottom: index < serviceKeys.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
            >
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${isEven ? "" : "lg:flex lg:flex-row-reverse"}`}>
                <FadeIn delay={0.1} className={isEven ? "" : "lg:ml-auto"}>
                  <div
                    className="relative overflow-hidden"
                    style={{ aspectRatio: "4/3", cursor: "pointer" }}
                    onClick={() => router.push(path)}
                  >
                    <SmartImage src={image} alt={tServices(`${key}.tag`)} hoverScale={1.04} containerClassName="w-full h-full" />
                    <div className="absolute top-0 left-0 w-12 h-12 pointer-events-none" style={{ borderTop: "2px solid #C9A84C", borderLeft: "2px solid #C9A84C" }} />
                    <div className="absolute bottom-0 right-0 w-12 h-12 pointer-events-none" style={{ borderBottom: "2px solid #C9A84C", borderRight: "2px solid #C9A84C" }} />
                  </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                  <div className={isEven ? "" : "lg:pr-8"}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-6 h-px bg-[#C9A84C]" />
                      <span
                        className="text-[#C9A84C] font-inter uppercase"
                        style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", letterSpacing: "0.3em", fontWeight: 500 }}
                      >
                        {tServices(`${key}.tag`)}
                      </span>
                    </div>

                    <h2
                      className="text-white font-playfair whitespace-pre-line mb-5"
                      style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.8rem)", fontWeight: 400, lineHeight: 1.2, letterSpacing: "-0.01em" }}
                    >
                      {tServices(`${key}.title`)}
                    </h2>

                    <div className="w-10 h-px bg-[#C9A84C]/40 mb-5" />

                    <p
                      className="text-white/45 font-inter mb-8"
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.9rem", lineHeight: 1.85, fontWeight: 300 }}
                    >
                      {tServices(`${key}.description`)}
                    </p>

                    <ul className="grid grid-cols-2 gap-2 mb-8">
                      {features.map((feat) => (
                        <li
                          key={feat}
                          className="flex items-center gap-2 font-inter"
                          style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", fontWeight: 300 }}
                        >
                          <div className="w-1 h-1 rounded-full bg-[#C9A84C] shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <motion.button
                      onClick={() => router.push(path)}
                      className="group flex items-center gap-3 font-inter"
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", letterSpacing: "0.22em", fontWeight: 600, textTransform: "uppercase", color: "#C9A84C", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      {tServices(`${key}.cta`)}
                      <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                    </motion.button>
                  </div>
                </FadeIn>
              </div>
            </div>
          );
        })}
      </section>

      <section
        className="relative py-24 md:py-32 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e0e18 0%, #1a1506 50%, #0e0e18 100%)", borderTop: "1px solid rgba(201,168,76,0.15)", borderBottom: "1px solid rgba(201,168,76,0.15)" }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" style={{ opacity: 0.025 }}>
          <span
            className="text-white font-playfair"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(6rem, 18vw, 18rem)", fontWeight: 700, letterSpacing: "-0.05em", whiteSpace: "nowrap" }}
          >
            SHEHNAI
          </span>
        </div>

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-8 h-px bg-[#C9A84C]" />
              <span
                className="text-[#C9A84C] font-inter uppercase"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", letterSpacing: "0.35em", fontWeight: 500 }}
              >
                {tHome("ctaBanner.eyebrow")}
              </span>
              <div className="w-8 h-px bg-[#C9A84C]" />
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h2
              className="text-white font-playfair mb-8"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 400, lineHeight: 1.3 }}
            >
              {tHome("ctaBanner.heading")}{" "}
              <span className="italic text-[#C9A84C]">{tHome("ctaBanner.headingAccent")}</span>
            </h2>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p
              className="text-white/45 font-inter mb-10"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.95rem", lineHeight: 1.75, fontWeight: 300 }}
            >
              {tHome("ctaBanner.subtext")}
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={siteLinks.tel}
                className="btn-premium flex items-center gap-3 bg-[#C9A84C] text-black hover:bg-[#dfc068] font-inter"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", letterSpacing: "0.22em", fontWeight: 600, textTransform: "uppercase", padding: "1rem 2.2rem" }}
              >
                {tHome("ctaBanner.callNow")}
              </a>
              <a
                href={siteLinks.mailto}
                className="btn-premium-outline flex items-center gap-3 border border-white/20 text-white/70 hover:border-[#C9A84C] hover:text-[#C9A84C] font-inter"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", letterSpacing: "0.22em", fontWeight: 500, textTransform: "uppercase", padding: "1rem 2.2rem" }}
              >
                {tHome("ctaBanner.enquiry")}
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}