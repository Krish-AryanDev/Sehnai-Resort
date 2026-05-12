"use client";

import { Sparkles, Music, Camera, ChefHat, Car, Clock, ArrowRight, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/FadeIn";
import { PageHero } from "@/components/PageHero";
import { ContactCTA } from "@/components/ContactCTA";
import { SmartImage } from "@/components/SmartImage";
import { siteLinks } from "@/lib/site-config";

const features = [
  { icon: Sparkles, title: "Grand Ballroom", desc: "Opulent interiors with crystal chandeliers and marble flooring for the most regal ambiance." },
  { icon: ChefHat, title: "In-house Catering", desc: "Our master chefs craft bespoke menus to satisfy every palate, from traditional to continental." },
  { icon: Music, title: "Audio & Lighting", desc: "State-of-the-art sound systems and dynamic lighting to set the perfect mood." },
  { icon: Camera, title: "Photo Backdrop Zones", desc: "Thoughtfully designed photo corners and backdrops built for picture-perfect moments." },
  { icon: Car, title: "Ample Parking", desc: "Secure, valet-assisted parking for all your guests with dedicated security staff." },
  { icon: Clock, title: "Event Coordination", desc: "A dedicated wedding coordinator assigned to you from planning through to the final dance." },
];

const packages = [
  {
    name: "Silver",
    tagline: "Classic Elegance",
    capacity: "Up to 200 guests",
    price: "Starting from ₹50,000",
    items: ["Main Hall Rental (8 hours)", "Basic Floral Décor", "Standard Catering Menu", "Sound System", "Welcome Drink Station"],
    highlight: false,
  },
  {
    name: "Gold",
    tagline: "The Signature Experience",
    capacity: "Up to 400 guests",
    price: "Starting from ₹1,00,000",
    items: ["Grand Ballroom (12 hours)", "Premium Floral Arrangements", "Multi-Cuisine Banquet", "Stage & Lighting Setup", "Dedicated Coordinator", "Complimentary Cake"],
    highlight: true,
  },
  {
    name: "Royal",
    tagline: "The Ultimate Celebration",
    capacity: "Up to 600 guests",
    price: "Starting from ₹2,00,000",
    items: ["Full Venue Exclusivity", "Luxury Décor Package", "Fine Dining Banquet", "Live Band Stage", "Bridal Suite Access", "Valet Parking", "Photography Booth"],
    highlight: false,
  },
];

export default function MarriageHallPage() {
  const t = useTranslations("marriageHall");

  return (
    <div style={{ backgroundColor: "#07070d" }}>
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        description={t("hero.description")}
        image="https://images.unsplash.com/photo-1769230366612-2217e2cd4653?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwd2VkZGluZyUyMG1hcnJpYWdlJTIwaGFsbCUyMGJhbnF1ZXR8ZW58MXx8fHwxNzc4NTIxNjg2fDA&ixlib=rb-4.1.0&q=80&w=1080"
      />

      <section className="py-20 md:py-28" style={{ backgroundColor: "#07070d" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeIn>
              <div className="relative">
                <SmartImage
                  src="https://images.unsplash.com/photo-1762216444919-043cf813e4de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvdXRkb29yJTIwd2VkZGluZyUyMHZlbnVlJTIwcmVjZXB0aW9uJTIwZ2FyZGVufGVufDF8fHx8MTc3ODUyMTcwN3ww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Wedding venue"
                  containerClassName="w-full"
                  containerStyle={{ aspectRatio: "4/3" }}
                />
                <div className="absolute top-0 left-0 w-10 h-10 pointer-events-none" style={{ borderTop: "2px solid #C9A84C", borderLeft: "2px solid #C9A84C" }} />
                <div className="absolute bottom-0 right-0 w-10 h-10 pointer-events-none" style={{ borderBottom: "2px solid #C9A84C", borderRight: "2px solid #C9A84C" }} />
                <div className="absolute -bottom-5 -right-5 w-28 h-28 flex flex-col items-center justify-center text-center" style={{ backgroundColor: "#C9A84C" }}>
                  <span className="text-black font-playfair" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 400, lineHeight: 1 }}>600</span>
                  <span className="text-black/70 font-inter uppercase" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.55rem", letterSpacing: "0.18em", fontWeight: 600, marginTop: "4px" }}>Guest Capacity</span>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-6 h-px bg-[#C9A84C]" />
                  <span className="text-[#C9A84C] font-inter uppercase" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", letterSpacing: "0.3em", fontWeight: 500 }}>
                    Our Story
                  </span>
                </div>
                <h2 className="text-white font-playfair mb-5" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 400, lineHeight: 1.2 }}>
                  Where Timeless Traditions Meet Modern Elegance
                </h2>
                <div className="w-10 h-px bg-[#C9A84C]/40 mb-5" />
                <p className="text-white/45 font-inter mb-5" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.9rem", lineHeight: 1.85, fontWeight: 300 }}>
                  Our marriage hall has been the chosen venue for thousands of couples over the years. With two grand halls capable of accommodating intimate gatherings and large celebrations alike, every inch of the space is designed to evoke grandeur and warmth in equal measure.
                </p>
                <p className="text-white/45 font-inter mb-8" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.9rem", lineHeight: 1.85, fontWeight: 300 }}>
                  From the first consultation to the last dance, our team of professional event planners is committed to bringing your vision to life with precision and care.
                </p>
                <a
                  href={siteLinks.tel}
                  className="btn-premium flex items-center gap-3 bg-[#C9A84C] text-black hover:bg-[#dfc068] font-inter w-fit"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", letterSpacing: "0.22em", fontWeight: 600, textTransform: "uppercase", padding: "0.9rem 2rem" }}
                >
                  <Phone size={13} />
                  Book a Viewing
                </a>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28" style={{ backgroundColor: "#0d0d16", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <FadeIn>
            <div className="text-center mb-14">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-6 h-px bg-[#C9A84C]" />
                <span className="text-[#C9A84C] font-inter uppercase" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", letterSpacing: "0.3em", fontWeight: 500 }}>
                  Hall Features
                </span>
                <div className="w-6 h-px bg-[#C9A84C]" />
              </div>
              <h2 className="text-white font-playfair" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 400, lineHeight: 1.2 }}>
                Everything You Need, <span className="italic text-[#C9A84C]">All Under One Roof</span>
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <FadeIn key={feat.title} delay={i * 0.07}>
                  <div className="p-8 flex flex-col gap-4" style={{ backgroundColor: "#0d0d16" }}>
                    <div className="w-10 h-10 flex items-center justify-center" style={{ border: "1px solid rgba(201,168,76,0.3)" }}>
                      <Icon size={18} className="text-[#C9A84C]" />
                    </div>
                    <h3 className="text-white font-playfair" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 400 }}>{feat.title}</h3>
                    <p className="text-white/40 font-inter" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", lineHeight: 1.75, fontWeight: 300 }}>{feat.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28" style={{ backgroundColor: "#07070d" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <FadeIn>
            <div className="text-center mb-14">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-6 h-px bg-[#C9A84C]" />
                <span className="text-[#C9A84C] font-inter uppercase" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", letterSpacing: "0.3em", fontWeight: 500 }}>
                  Packages
                </span>
                <div className="w-6 h-px bg-[#C9A84C]" />
              </div>
              <h2 className="text-white font-playfair" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 400 }}>
                Choose Your Package
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg, i) => (
              <FadeIn key={pkg.name} delay={i * 0.1}>
                <div className="relative flex flex-col p-8" style={{ backgroundColor: pkg.highlight ? "rgba(201,168,76,0.06)" : "#0d0d16", border: pkg.highlight ? "1px solid rgba(201,168,76,0.4)" : "1px solid rgba(255,255,255,0.06)" }}>
                  {pkg.highlight && <div className="absolute -top-px left-0 right-0 h-0.5" style={{ backgroundColor: "#C9A84C" }} />}
                  {pkg.highlight && (
                    <div className="absolute top-4 right-4 font-inter uppercase" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.55rem", letterSpacing: "0.25em", fontWeight: 600, color: "#000", backgroundColor: "#C9A84C", padding: "3px 8px" }}>
                      Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-white font-playfair mb-1" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 400 }}>{pkg.name}</h3>
                    <p className="text-[#C9A84C] font-inter italic" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", fontWeight: 300 }}>{pkg.tagline}</p>
                  </div>

                  <div className="w-8 h-px bg-[#C9A84C]/40 mb-6" />

                  <p className="text-white/35 font-inter mb-1" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", letterSpacing: "0.1em" }}>{pkg.capacity}</p>
                  <p className="text-[#C9A84C] font-playfair mb-6" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 400 }}>{pkg.price}</p>

                  <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                    {pkg.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 font-inter" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", fontWeight: 300 }}>
                        <div className="w-1 h-1 rounded-full bg-[#C9A84C] mt-2 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`${pkg.highlight ? "btn-premium" : "btn-premium-outline"} w-full py-3 font-inter flex items-center justify-center gap-2 group`}
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", letterSpacing: "0.22em", fontWeight: 600, textTransform: "uppercase", backgroundColor: pkg.highlight ? "#C9A84C" : "transparent", color: pkg.highlight ? "#000" : "#C9A84C", border: pkg.highlight ? "none" : "1px solid rgba(201,168,76,0.4)" }}
                  >
                    Book This Package
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <ContactCTA title={t("cta.title")} description={t("cta.description")} primaryLabel={t("cta.primary")} />
    </div>
  );
}
