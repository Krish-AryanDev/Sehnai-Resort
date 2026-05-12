import { Phone } from "lucide-react";
import { FadeIn } from "./FadeIn";

interface ContactCTAProps {
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref?: string;
  secondaryLabel?: string;
}

export function ContactCTA({
  title,
  description,
  primaryLabel,
  primaryHref = "tel:+0000000000",
  secondaryLabel,
}: ContactCTAProps) {
  return (
    <section
      className="py-16 md:py-20"
      style={{ backgroundColor: "#0d0d16", borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="max-w-2xl mx-auto px-6 text-center">
        <FadeIn>
          <h2
            className="text-white font-playfair mb-4"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
              fontWeight: 400,
            }}
          >
            {title}
          </h2>
          <p
            className="text-white/40 font-inter mb-8"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.9rem",
              lineHeight: 1.75,
              fontWeight: 300,
            }}
          >
            {description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={primaryHref}
              className="inline-flex items-center gap-3 bg-[#C9A84C] text-black hover:bg-[#dfc068] transition-all duration-300 font-inter"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.72rem",
                letterSpacing: "0.22em",
                fontWeight: 600,
                textTransform: "uppercase",
                padding: "1rem 2.5rem",
              }}
            >
              <Phone size={13} />
              {primaryLabel}
            </a>
            {secondaryLabel && (
              <button
                className="inline-flex items-center gap-3 font-inter border border-white/15 text-white/60 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all duration-300"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.72rem",
                  letterSpacing: "0.22em",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  padding: "1rem 2.5rem",
                  background: "none",
                  cursor: "pointer",
                }}
              >
                {secondaryLabel}
              </button>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
