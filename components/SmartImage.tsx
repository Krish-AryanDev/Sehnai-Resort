"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion } from "motion/react";

type SmartImageProps = {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  containerStyle?: CSSProperties;
  priority?: boolean;
  hoverScale?: number;
  objectPosition?: string;
};

export function SmartImage({
  src,
  alt,
  className = "w-full h-full object-cover",
  containerClassName = "",
  containerStyle,
  priority = false,
  hoverScale,
  objectPosition,
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <div
      className={`overflow-hidden ${containerClassName}`}
      style={containerStyle}
    >
      {/* Inner fill layer — uses absolute inset-0 so height always resolves
          regardless of whether the outer container uses aspect-ratio or h-full */}
      <div style={{ position: "absolute", inset: 0 }}>
        <div
          aria-hidden
          className="transition-opacity duration-700 ease-out"
          style={{
            position: "absolute",
            inset: 0,
            opacity: loaded ? 0 : 1,
            background:
              "linear-gradient(90deg, #0a0a13 0%, #16161f 50%, #0a0a13 100%)",
            backgroundSize: "200% 100%",
            animation: "smart-shimmer 1.6s linear infinite",
          }}
        />

        <motion.img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={
            loaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.04 }
          }
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          whileHover={hoverScale ? { scale: hoverScale } : undefined}
          className={className}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: objectPosition ?? "center",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
