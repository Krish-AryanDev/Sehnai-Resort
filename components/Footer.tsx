import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { Instagram, Facebook, Twitter } from "./SocialIcons";
import { siteConfig } from "@/lib/site-config";

const hallLinks = [
  "Grand Ballroom",
  "Packages & Pricing",
  "Photo Gallery",
  "Virtual Tour",
  "Book a Viewing",
];
const restaurantLinks = [
  "Our Menu",
  "Reserve a Table",
  "Private Dining",
  "Catering Services",
  "Chef's Special",
];
const hotelLinks = [
  "Room Types",
  "Amenities",
  "Room Service",
  "Check Availability",
  "Special Offers",
];

const contactInfo = [
  { icon: Phone, text: siteConfig.phoneDisplay },
  { icon: Mail, text: siteConfig.email },
  { icon: MapPin, text: siteConfig.address },
];

const socials: { Icon: typeof Instagram; href: string; label: string }[] = [
  { Icon: Instagram, href: siteConfig.social.instagram, label: "Instagram" },
  { Icon: Facebook, href: siteConfig.social.facebook, label: "Facebook" },
  { Icon: Twitter, href: siteConfig.social.twitter, label: "Twitter" },
];
const bottomLinks = ["Privacy Policy", "Terms of Service", "Contact Us"];

function FooterColumn({
  title,
  links,
  href,
}: {
  title: string;
  links: string[];
  href: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <div className="w-5 h-px bg-[#C9A84C]" />
        <h3
          className="text-white font-inter uppercase"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.7rem",
            letterSpacing: "0.3em",
            fontWeight: 500,
          }}
        >
          {title}
        </h3>
      </div>
      <ul className="flex flex-col gap-3">
        {links.map((item) => (
          <li key={item}>
            <Link
              href={href}
              className="text-white/40 font-inter transition-colors duration-200 hover:text-[#C9A84C]"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.82rem",
                fontWeight: 300,
              }}
            >
              {item}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        backgroundColor: "#07070d",
        borderTop: "1px solid rgba(201, 168, 76, 0.15)",
      }}
    >
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="mb-5">
              <p
                className="text-[#C9A84C] font-inter"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.6rem",
                  letterSpacing: "0.45em",
                  fontWeight: 500,
                  marginBottom: "4px",
                }}
              >
                THE
              </p>
              <h2
                className="text-white font-playfair"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  lineHeight: 1,
                }}
              >
                SEHNAI RESORT
              </h2>
            </div>

            <div className="w-8 h-px bg-[#C9A84C] mb-5" />

            <p
              className="text-white/45 font-inter mb-6"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.82rem",
                lineHeight: 1.8,
                fontWeight: 300,
              }}
            >
              Three exceptional experiences under one roof — a magnificent marriage hall, a fine dining restaurant, and a boutique luxury hotel.
            </p>

            {/* Contact info */}
            <div className="flex flex-col gap-3 mb-6">
              {contactInfo.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon size={12} className="text-[#C9A84C] shrink-0" />
                  <span
                    className="text-white/45 font-inter"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.78rem",
                    }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 border border-white/15 flex items-center justify-center text-white/40 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all duration-300"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Marriage Hall" links={hallLinks} href="/marriage-hall" />
          <FooterColumn title="Restaurant" links={restaurantLinks} href="/restaurant" />
          <FooterColumn title="Hotel" links={hotelLinks} href="/hotel" />
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-3"
      >
        <span
          className="text-white/25 font-inter"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.72rem",
            letterSpacing: "0.06em",
          }}
        >
          © {currentYear} Sehnai Resort. All rights reserved.
        </span>
        <div className="flex items-center gap-6">
          {bottomLinks.map((item) => (
            <a
              key={item}
              href="#"
              className="text-white/25 hover:text-white/50 font-inter transition-colors duration-200"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.72rem",
              }}
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
