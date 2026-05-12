"use client";

import { motion } from "motion/react";
import { SmartImage } from "@/components/SmartImage";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
}

export function PageHero({ eyebrow, title, description, image }: PageHeroProps) {
  return (
    <section
      className="relative flex items-end pb-20 md:pb-28 overflow-hidden"
      style={{ minHeight: "70vh" }}
    >
      <SmartImage
        src={image}
        alt=""
        priority
        containerClassName="absolute inset-0"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-[#C9A84C]" />
            <span
              className="text-[#C9A84C] font-inter uppercase"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.68rem",
                letterSpacing: "0.35em",
                fontWeight: 500,
              }}
            >
              {eyebrow}
            </span>
          </div>
          <h1
            className="text-white font-playfair"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              maxWidth: "700px",
            }}
          >
            {title}
          </h1>
          <p
            className="text-white/55 font-inter mt-4"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "1rem",
              lineHeight: 1.7,
              fontWeight: 300,
              maxWidth: "500px",
            }}
          >
            {description}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
