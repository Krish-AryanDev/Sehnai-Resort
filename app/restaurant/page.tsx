"use client";

import { Clock, Users, Leaf, Wine, ArrowRight, Phone } from "lucide-react";
import { FadeIn } from "@/components/FadeIn";
import { PageHero } from "@/components/PageHero";
import { ContactCTA } from "@/components/ContactCTA";
import { SmartImage } from "@/components/SmartImage";
import { siteLinks } from "@/lib/site-config";

const menuCategories = [
  {
    name: "Starters",
    emoji: "🥗",
    items: ["Bruschetta al Pomodoro", "Seared Scallops", "Spiced Lamb Kibbeh", "Truffle Arancini"],
  },
  {
    name: "Mains",
    emoji: "🍽️",
    items: ["Pan-Seared Salmon", "Slow-Roasted Prime Rib", "Chicken Tikka Masala", "Mushroom Risotto"],
  },
  {
    name: "Desserts",
    emoji: "🍮",
    items: ["Crème Brûlée", "Chocolate Fondant", "Saffron Panna Cotta", "Mango Tarte Tatin"],
  },
  {
    name: "Beverages",
    emoji: "🍷",
    items: ["Curated Wine Selection", "Artisan Cocktails", "Fresh Juices & Mocktails", "Premium Teas & Coffee"],
  },
];

const highlights = [
  { icon: Clock, title: "Open Daily", desc: "Lunch 12:00 PM – 3:30 PM\nDinner 7:00 PM – 11:00 PM" },
  { icon: Users, title: "Private Dining", desc: "Exclusive private dining rooms for up to 30 guests — perfect for corporate events and intimate celebrations." },
  { icon: Leaf, title: "Fresh Ingredients", desc: "We source only the freshest, locally grown seasonal produce to craft dishes with authentic flavors." },
  { icon: Wine, title: "Premium Bar", desc: "An expertly curated bar featuring fine wines, aged spirits, and signature craft cocktails." },
];

export default function RestaurantPage() {
  return (
    <div style={{ backgroundColor: "#07070d" }}>
      <PageHero
        eyebrow="Fine Dining"
        title="The Restaurant"
        description="A culinary destination where every dish tells a story and every evening becomes unforgettable."
        image="https://images.unsplash.com/photo-1776993298456-98c71c0e177e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXN0YXVyYW50JTIwZmluZSUyMGRpbmluZyUyMGludGVyaW9yfGVufDF8fHx8MTc3ODUyMTY4N3ww&ixlib=rb-4.1.0&q=80&w=1080"
      />

      {/* About + Image */}
      <section className="py-20 md:py-28" style={{ backgroundColor: "#07070d" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeIn delay={0.1}>
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-6 h-px bg-[#C9A84C]" />
                  <span
                    className="text-[#C9A84C] font-inter uppercase"
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", letterSpacing: "0.3em", fontWeight: 500 }}
                  >
                    Our Philosophy
                  </span>
                </div>
                <h2
                  className="text-white font-playfair mb-5"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
                    fontWeight: 400,
                    lineHeight: 1.2,
                  }}
                >
                  Crafted with Passion,{" "}
                  <span className="italic text-[#C9A84C]">Served with Love</span>
                </h2>
                <div className="w-10 h-px bg-[#C9A84C]/40 mb-5" />
                <p
                  className="text-white/45 font-inter mb-5"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.9rem", lineHeight: 1.85, fontWeight: 300 }}
                >
                  At Sehnai Resort, our culinary team brings together generations of knowledge and the finest ingredients from around the world. We believe that great food is not just nourishment — it is an experience.
                </p>
                <p
                  className="text-white/45 font-inter mb-8"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.9rem", lineHeight: 1.85, fontWeight: 300 }}
                >
                  Whether you're joining us for a leisurely lunch, a romantic dinner, or a private celebration, our team is dedicated to ensuring every visit exceeds your expectations.
                </p>
                <a
                  href={siteLinks.tel}
                  className="flex items-center gap-3 bg-[#C9A84C] text-black hover:bg-[#dfc068] transition-all duration-300 font-inter w-fit"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.72rem",
                    letterSpacing: "0.22em",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    padding: "0.9rem 2rem",
                  }}
                >
                  <Phone size={13} />
                  Reserve a Table
                </a>
              </div>
            </FadeIn>

            <FadeIn>
              <div className="relative">
                <SmartImage
                  src="https://images.unsplash.com/photo-1750943024048-a4c9912b1425?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwZm9vZCUyMHBsYXRpbmclMjBlbGVnYW50JTIwZGlzaHxlbnwxfHx8fDE3Nzg1MjE3MDR8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Fine dining"
                  containerClassName="w-full"
                  containerStyle={{ aspectRatio: "4/3" }}
                />
                <div className="absolute top-0 left-0 w-10 h-10 pointer-events-none" style={{ borderTop: "2px solid #C9A84C", borderLeft: "2px solid #C9A84C" }} />
                <div className="absolute bottom-0 right-0 w-10 h-10 pointer-events-none" style={{ borderBottom: "2px solid #C9A84C", borderRight: "2px solid #C9A84C" }} />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Menu Preview */}
      <section
        className="py-20 md:py-28"
        style={{ backgroundColor: "#0d0d16", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <FadeIn>
            <div className="text-center mb-14">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-6 h-px bg-[#C9A84C]" />
                <span
                  className="text-[#C9A84C] font-inter uppercase"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", letterSpacing: "0.3em", fontWeight: 500 }}
                >
                  Our Menu
                </span>
                <div className="w-6 h-px bg-[#C9A84C]" />
              </div>
              <h2
                className="text-white font-playfair"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 400 }}
              >
                A Taste of What Awaits
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {menuCategories.map((cat, i) => (
              <FadeIn key={cat.name} delay={i * 0.09}>
                <div className="p-7" style={{ backgroundColor: "#0a0a13", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-3 mb-5">
                    <span style={{ fontSize: "1.3rem" }}>{cat.emoji}</span>
                    <h3
                      className="text-white font-playfair"
                      style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 400 }}
                    >
                      {cat.name}
                    </h3>
                  </div>
                  <div className="w-6 h-px bg-[#C9A84C]/40 mb-4" />
                  <ul className="flex flex-col gap-2.5">
                    {cat.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 font-inter"
                        style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", fontWeight: 300, lineHeight: 1.5 }}
                      >
                        <div className="w-0.5 h-0.5 rounded-full bg-[#C9A84C] mt-2.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.2}>
            <div className="text-center mt-10">
              <button
                className="flex items-center gap-3 font-inter mx-auto group"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.72rem",
                  letterSpacing: "0.22em",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "#C9A84C",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                View Full Menu
                <ArrowRight size={13} className="group-hover:translate-x-1.5 transition-transform duration-300" />
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Highlights / Info Cards */}
      <section className="py-20 md:py-28" style={{ backgroundColor: "#07070d" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {highlights.map((item, i) => {
              const Icon = item.icon;
              return (
                <FadeIn key={item.title} delay={i * 0.08}>
                  <div className="flex gap-5 p-7" style={{ backgroundColor: "#0d0d16", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="w-11 h-11 flex items-center justify-center shrink-0" style={{ border: "1px solid rgba(201,168,76,0.3)" }}>
                      <Icon size={18} className="text-[#C9A84C]" />
                    </div>
                    <div>
                      <h3
                        className="text-white font-playfair mb-2"
                        style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 400 }}
                      >
                        {item.title}
                      </h3>
                      <p
                        className="text-white/40 font-inter whitespace-pre-line"
                        style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", lineHeight: 1.75, fontWeight: 300 }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bar / Ambiance Full-Width Image */}
      <section className="relative overflow-hidden" style={{ height: "380px" }}>
        <SmartImage
          src="https://images.unsplash.com/photo-1777791374900-fd17067702fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwYmFyJTIwY29ja3RhaWxzJTIwYW1iaWFuY2UlMjBuaWdodHxlbnwxfHx8fDE3Nzg1MjE3MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Restaurant bar"
          containerClassName="absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent pointer-events-none" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 md:px-10 w-full">
            <FadeIn>
              <p
                className="text-[#C9A84C] font-playfair italic"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.3rem, 3vw, 2.2rem)", fontWeight: 400, maxWidth: "500px", lineHeight: 1.4 }}
              >
                "Good food is the foundation of genuine happiness."
              </p>
              <p
                className="text-white/35 font-inter mt-3"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", letterSpacing: "0.15em" }}
              >
                — Auguste Escoffier
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      <ContactCTA
        title="Reserve Your Table Tonight"
        description="Call us to reserve, or walk in during our open hours. We look forward to serving you."
        primaryLabel="Reserve Now"
      />
    </div>
  );
}
