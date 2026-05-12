import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CustomCursor } from "@/components/CustomCursor";
import { SmoothScroll } from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "Sehnai Resort — Marriage Hall, Restaurant & Hotel",
  description:
    "Three exceptional experiences under one roof — a magnificent marriage hall, a fine dining restaurant, and a boutique luxury hotel.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll />
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#07070d" }}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <CustomCursor />
      </body>
    </html>
  );
}
