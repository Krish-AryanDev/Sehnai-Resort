"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

const HOVER_SELECTOR =
  'a, button, [role="button"], label, [data-cursor-hover], input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"]';

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const ringX = useSpring(mouseX, { damping: 28, stiffness: 260, mass: 0.4 });
  const ringY = useSpring(mouseY, { damping: 28, stiffness: 260, mass: 0.4 });

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => setEnabled(fine.matches && !reduce.matches);
    update();

    fine.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!visible) setVisible(true);

      const target = e.target as HTMLElement | null;
      setHovering(!!target?.closest(HOVER_SELECTOR));
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);
    const onBlur = () => setVisible(false);

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled, visible, mouseX, mouseY]);

  if (!enabled) return null;

  return (
    <>
      {/* Outer trailing ring */}
      <motion.div
        aria-hidden
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{ x: ringX, y: ringY }}
      >
        <motion.div
          className="rounded-full border"
          style={{
            width: 36,
            height: 36,
            marginLeft: -18,
            marginTop: -18,
            borderColor: "#C9A84C",
          }}
          animate={{
            scale: hovering ? 1.7 : 1,
            opacity: visible ? (hovering ? 0.9 : 0.5) : 0,
            borderWidth: hovering ? 1.5 : 1,
          }}
          transition={{ type: "spring", damping: 22, stiffness: 280, mass: 0.4 }}
        />
      </motion.div>

      {/* Inner dot (exact position) */}
      <motion.div
        aria-hidden
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{ x: mouseX, y: mouseY }}
      >
        <motion.div
          className="rounded-full bg-[#C9A84C]"
          style={{
            width: 6,
            height: 6,
            marginLeft: -3,
            marginTop: -3,
          }}
          animate={{
            scale: hovering ? 0 : 1,
            opacity: visible ? 1 : 0,
          }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        />
      </motion.div>
    </>
  );
}
