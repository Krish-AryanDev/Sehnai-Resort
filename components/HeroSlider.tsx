"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/SmartImage";

const SLIDE_DURATION = 3500;

const slides = [
  {
    id: 0,
    tag: "Marriage Hall",
    number: "01",
    heading: "Where Love\nStories Begin",
    subtext:
      "Transform your special day into an unforgettable celebration in our magnificent halls, accommodating up to 600 guests.",
    cta: "Explore Our Venue",
    path: "/marriage-hall",
    image:
      "https://images.unsplash.com/photo-1769230366612-2217e2cd4653?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwd2VkZGluZyUyMG1hcnJpYWdlJTIwaGFsbCUyMGJhbnF1ZXR8ZW58MXx8fHwxNzc4NTIxNjg2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    position: "center",
  },
  {
    id: 1,
    tag: "Fine Dining",
    number: "02",
    heading: "A Culinary Journey\nLike No Other",
    subtext:
      "Savor exquisite flavors crafted with passion and served with timeless elegance. A complete experience for all your senses.",
    cta: "Reserve a Table",
    path: "/restaurant",
    image:
      "https://images.unsplash.com/photo-1776993298456-98c71c0e177e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXN0YXVyYW50JTIwZmluZSUyMGRpbmluZyUyMGludGVyaW9yfGVufDF8fHx8MTc3ODUyMTY4N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    position: "center",
  },
  {
    id: 2,
    tag: "Luxury Hotel",
    number: "03",
    heading: "Your Home\nAway From Home",
    subtext:
      "Experience unparalleled comfort and elegance across our 12 premium rooms. Every stay is a cherished memory.",
    cta: "Book a Stay",
    path: "/hotel",
    image:
      "https://images.unsplash.com/photo-1776763018821-8feeaeeee0a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHJvb20lMjBpbnRlcmlvciUyMGVsZWdhbnR8ZW58MXx8fHwxNzc4NDgyNTc3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    position: "center",
  },
];

const EASE_OUT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const imageVariants: Variants = {
  enter: { opacity: 0, scale: 1.08 },
  center: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.8, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    transition: { duration: 1.0, ease: "easeIn" },
  },
};

const contentVariants: Variants = {
  enter: { opacity: 0 },
  center: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.15 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.5 },
  },
};

const itemVariants: Variants = {
  enter: { opacity: 0, y: 32 },
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.0, ease: EASE_OUT },
  },
  exit: { opacity: 0, y: -16 },
};

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const router = useRouter();
  const touchStartX = useRef(0);
  const resetKey = useRef(0);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
    resetKey.current += 1;
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const manualNext = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, goTo]);

  const manualPrev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [next]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") manualPrev();
      if (e.key === "ArrowRight") manualNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [manualNext, manualPrev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) manualNext();
      else manualPrev();
    }
  };

  const slide = slides[current];

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ height: "100dvh", minHeight: "600px" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress animation keyframes */}
      <style>{`
        @keyframes progressAnim {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>

      {/* Background Images — concurrent crossfade */}
      <AnimatePresence initial={false}>
        <motion.div
          key={current}
          variants={imageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          <SmartImage
            src={slide.image}
            alt={slide.tag}
            priority={current === 0}
            containerClassName="w-full h-full"
            objectPosition={slide.position}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

      {/* Vertical slide number indicator — desktop only */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col items-center gap-3">
        <AnimatePresence mode="wait">
          <motion.span
            key={current}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-[#C9A84C] font-playfair"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "2.5rem",
              fontWeight: 400,
              lineHeight: 1,
            }}
          >
            {slide.number}
          </motion.span>
        </AnimatePresence>
        <div className="w-px h-14 bg-white/25" />
        <span
          className="text-white/40 font-inter"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", letterSpacing: "0.1em" }}
        >
          0{slides.length}
        </span>
      </div>

      {/* Left Arrow */}
      <button
        onClick={manualPrev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 border border-white/30 flex items-center justify-center text-white hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all duration-300 backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Right Arrow */}
      <button
        onClick={manualNext}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 border border-white/30 flex items-center justify-center text-white hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all duration-300 backdrop-blur-sm lg:right-24"
        aria-label="Next slide"
      >
        <ChevronRight size={18} />
      </button>

      {/* Main Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="px-8 md:px-16 lg:px-24 max-w-2xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              variants={contentVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {/* Tag line */}
              <motion.div variants={itemVariants} className="flex items-center gap-3 mb-5">
                <div className="w-8 h-px bg-[#C9A84C]" />
                <span
                  className="text-[#C9A84C] font-inter uppercase"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.72rem",
                    letterSpacing: "0.35em",
                    fontWeight: 500,
                  }}
                >
                  {slide.tag}
                </span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                variants={itemVariants}
                className="text-white font-playfair whitespace-pre-line mb-6"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "clamp(2.8rem, 6vw, 5.5rem)",
                  fontWeight: 400,
                  lineHeight: 1.1,
                  letterSpacing: "-0.01em",
                }}
              >
                {slide.heading}
              </motion.h1>

              {/* Subtext */}
              <motion.p
                variants={itemVariants}
                className="text-white/65 font-inter mb-10 max-w-md"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "clamp(0.9rem, 1.5vw, 1.05rem)",
                  lineHeight: 1.7,
                  fontWeight: 300,
                }}
              >
                {slide.subtext}
              </motion.p>

              {/* CTA Button */}
              <motion.button
                variants={itemVariants}
                onClick={() => router.push(slide.path)}
                className="group flex items-center gap-3 bg-[#C9A84C] text-black hover:bg-[#dfc068] active:bg-[#b8953e] transition-all duration-300 font-inter"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.75rem",
                  letterSpacing: "0.25em",
                  fontWeight: 600,
                  padding: "1rem 2rem",
                  textTransform: "uppercase",
                }}
              >
                {slide.cta}
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1.5 transition-transform duration-300"
                />
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Progress Bars + Dots */}
      <div className="absolute bottom-8 left-8 md:left-16 lg:left-24 z-20 flex items-center gap-5">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="flex flex-col gap-2 group"
            aria-label={`Go to slide ${i + 1}`}
          >
            {/* Bar */}
            <div
              className="relative overflow-hidden"
              style={{
                width: i === current ? "70px" : "36px",
                height: "2px",
                backgroundColor: "rgba(255,255,255,0.25)",
                transition: "width 0.4s ease",
              }}
            >
              {i === current && (
                <div
                  key={`fill-${current}`}
                  className="absolute top-0 left-0 h-full w-full bg-[#C9A84C]"
                  style={{
                    transformOrigin: "left",
                    transform: "scaleX(0)",
                    animation: `progressAnim ${SLIDE_DURATION}ms linear forwards`,
                  }}
                />
              )}
              {i < current && <div className="absolute inset-0 bg-[#C9A84C]" />}
            </div>
          </button>
        ))}

        {/* Slide counter */}
        <span
          className="text-white/40 font-inter ml-1"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.7rem",
            letterSpacing: "0.12em",
          }}
        >
          {slide.number} / 0{slides.length}
        </span>
      </div>

      {/* Swipe hint on mobile */}
      <motion.div
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 2, duration: 1.5 }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 md:hidden flex items-center gap-2"
      >
        <div
          className="text-white/50 text-xs font-inter tracking-widest"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          SWIPE TO EXPLORE
        </div>
      </motion.div>
    </div>
  );
}
