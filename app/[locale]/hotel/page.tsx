"use client";

import { Wifi, Car, Coffee, Shield, Wind, ArrowRight, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/FadeIn";
import { PageHero } from "@/components/PageHero";
import { ContactCTA } from "@/components/ContactCTA";
import { SmartImage } from "@/components/SmartImage";

const rooms = [
  {
    type: "Standard Room",
    count: "6 Rooms",
    size: "280 sq ft",
    price: "From ₹1,500 / night",
    description: "Elegantly appointed rooms with all essentials for a comfortable stay, featuring plush bedding and modern finishes.",
    features: ["King / Twin Bed", "En-suite Bathroom", "Smart TV", "Work Desk", "Free Wi-Fi"],
    image: "https://images.unsplash.com/photo-1776763018821-8feeaeeee0a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHJvb20lMjBpbnRlcmlvciUyMGVsZWdhbnR8ZW58MXx8fHwxNzc4NDgyNTc3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    highlight: false,
  },
  {
    type: "Deluxe Room",
    count: "5 Rooms",
    size: "380 sq ft",
    price: "From ₹2,500 / night",
    description: "Spacious rooms with premium furnishings, upgraded amenities, and stunning city or garden views — perfect for longer stays.",
    features: ["King Bed", "Luxury Bathroom", "Minibar", "Smart TV", "Premium Toiletries", "Daily Turn-down"],
    image: "https://images.unsplash.com/photo-1771206331424-44b8ec9acdf4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGxvYmJ5JTIwcHJlbWl1bSUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3Nzg1MjE3MDV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    highlight: true,
  },
  {
    type: "Suite",
    count: "2 Suites",
    size: "560 sq ft",
    price: "From ₹4,500 / night",
    description: "Our exclusive suites offer a complete luxury experience with a separate living area, premium décor, and personalised service.",
    features: ["King Bed + Lounge", "Jacuzzi Bath", "Dining Area", "Complimentary Breakfast", "Priority Room Service", "Late Checkout"],
    image: "https://images.unsplash.com/photo-1561811358-21aef14f0551?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHN3aW1taW5nJTIwcG9vbCUyMHJlc29ydCUyMGx1eHVyeSUyMG91dGRvb3J8ZW58MXx8fHwxNzc4NTIxNzA4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    highlight: false,
  },
];

const amenities = [
  { icon: Wifi, label: "High-Speed Wi-Fi", desc: "Complimentary fiber Wi-Fi throughout the property" },
  { icon: Coffee, label: "Breakfast Service", desc: "Fresh continental breakfast served daily 7–10 AM" },
  { icon: Car, label: "Free Parking", desc: "Secure, monitored parking for all hotel guests" },
  { icon: Shield, label: "24/7 Security", desc: "Round-the-clock security and reception team" },
  { icon: Wind, label: "Climate Control", desc: "Individual air conditioning in every room" },
  { icon: Star, label: "Room Service", desc: "In-room dining available throughout the day" },
];

export default function HotelPage() {
  const t = useTranslations("hotel");

  return (
    <div style={{ backgroundColor: "#07070d" }}>
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        description={t("hero.description")}
        image="https://images.unsplash.com/photo-1776763018821-8feeaeeee0a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHJvb20lMjBpbnRlcmlvciUyMGVsZWdhbnR8ZW58MXx8fHwxNzc4NDgyNTc3fDA&ixlib=rb-4.1.0&q=80&w=1080"
      />

      <section className="py-20 md:py-28" style={{ backgroundColor: "#07070d" }}>
        <div className="max-w-4xl mx-auto px-6 md:px-10 text-center">
          <FadeIn>
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="w-6 h-px bg-[#C9A84C]" />
              <span className="text-[#C9A84C] font-inter uppercase" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", letterSpacing: "0.3em", fontWeight: 500 }}>
                A Sanctuary Awaits
              </span>
              <div className="w-6 h-px bg-[#C9A84C]" />
            </div>
            <h2 className="text-white font-playfair mb-5" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 400, lineHeight: 1.25 }}>
              Where Every Detail <span className="italic text-[#C9A84C]">Speaks of Luxury</span>
            </h2>
            <p className="text-white/45 font-inter" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.95rem", lineHeight: 1.85, fontWeight: 300 }}>
              Our boutique hotel offers an intimate and attentive experience that larger hotels simply cannot match. With 12 carefully designed rooms — from cozy Standard rooms to spacious Suites — every guest enjoys a personalised stay tailored to their needs.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-20 md:py-28" style={{ backgroundColor: "#0d0d16", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <FadeIn>
            <div className="flex items-center justify-center gap-3 mb-14 text-center">
              <div className="w-6 h-px bg-[#C9A84C]" />
              <span className="text-[#C9A84C] font-inter uppercase" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", letterSpacing: "0.3em", fontWeight: 500 }}>
                Our Rooms
              </span>
              <div className="w-6 h-px bg-[#C9A84C]" />
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rooms.map((room, i) => (
              <FadeIn key={room.type} delay={i * 0.1}>
                <div className="flex flex-col overflow-hidden" style={{ backgroundColor: room.highlight ? "rgba(201,168,76,0.04)" : "#0a0a13", border: room.highlight ? "1px solid rgba(201,168,76,0.35)" : "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
                    <SmartImage src={room.image} alt={room.type} hoverScale={1.05} containerClassName="w-full h-full" />
                    {room.highlight && (
                      <div className="absolute top-3 right-3 font-inter uppercase" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.55rem", letterSpacing: "0.2em", fontWeight: 600, color: "#000", backgroundColor: "#C9A84C", padding: "3px 8px" }}>
                        Most Popular
                      </div>
                    )}
                    {room.highlight && <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#C9A84C]" />}
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-white font-playfair" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 400 }}>{room.type}</h3>
                        <p className="text-white/35 font-inter mt-1" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", letterSpacing: "0.1em" }}>{room.count} · {room.size}</p>
                      </div>
                      <p className="text-[#C9A84C] font-playfair text-right" style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", fontWeight: 400, lineHeight: 1.3 }}>{room.price}</p>
                    </div>

                    <div className="w-6 h-px bg-[#C9A84C]/30 mb-4" />

                    <p className="text-white/40 font-inter mb-5 flex-1" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", lineHeight: 1.75, fontWeight: 300 }}>{room.description}</p>

                    <ul className="flex flex-col gap-2 mb-6">
                      {room.features.map((feat) => (
                        <li key={feat} className="flex items-center gap-2 font-inter" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>
                          <div className="w-1 h-1 rounded-full bg-[#C9A84C] shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`${room.highlight ? "btn-premium" : "btn-premium-outline"} w-full py-3 font-inter flex items-center justify-center gap-2 group`}
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", letterSpacing: "0.2em", fontWeight: 600, textTransform: "uppercase", backgroundColor: room.highlight ? "#C9A84C" : "transparent", color: room.highlight ? "#000" : "#C9A84C", border: room.highlight ? "none" : "1px solid rgba(201,168,76,0.35)" }}
                    >
                      Book This Room
                      <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              </FadeIn>
            ))}
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
                  Amenities
                </span>
                <div className="w-6 h-px bg-[#C9A84C]" />
              </div>
              <h2 className="text-white font-playfair" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 400 }}>
                Every Comfort, <span className="italic text-[#C9A84C]">Thoughtfully Provided</span>
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {amenities.map((item, i) => {
              const Icon = item.icon;
              return (
                <FadeIn key={item.label} delay={i * 0.07}>
                  <div className="p-6 flex flex-col gap-3" style={{ backgroundColor: "#0d0d16", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <Icon size={20} className="text-[#C9A84C]" />
                    <h3 className="text-white font-playfair" style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", fontWeight: 400 }}>{item.label}</h3>
                    <p className="text-white/35 font-inter" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", lineHeight: 1.7, fontWeight: 300 }}>{item.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden" style={{ height: "360px" }}>
        <SmartImage
          src="https://images.unsplash.com/photo-1561811358-21aef14f0551?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHN3aW1taW5nJTIwcG9vbCUyMHJlc29ydCUyMGx1eHVyeSUyMG91dGRvb3J8ZW58MXx8fHwxNzc4NTIxNzA4fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Hotel exterior"
          containerClassName="absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 to-transparent pointer-events-none" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 md:px-10 w-full">
            <FadeIn>
              <p className="text-[#C9A84C] font-playfair italic" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.3rem, 3vw, 2rem)", fontWeight: 400, maxWidth: "500px", lineHeight: 1.4 }}>
                &quot;Luxury is not about things. It&apos;s about the feeling.&quot;
              </p>
              <p className="text-white/35 font-inter mt-3" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", letterSpacing: "0.15em" }}>— Shehnai Resort</p>
            </FadeIn>
          </div>
        </div>
      </section>

      <ContactCTA
        title={t("cta.title")}
        description={t("cta.description")}
        primaryLabel={t("cta.primary")}
        secondaryLabel={t("cta.secondary")}
      />
    </div>
  );
}
