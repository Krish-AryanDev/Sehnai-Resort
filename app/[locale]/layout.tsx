import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CustomCursor } from "@/components/CustomCursor";
import { SmoothScroll } from "@/components/SmoothScroll";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { IntroScreen } from "@/components/IntroScreen";

export const metadata: Metadata = {
  title: "Shehnai Resort — Marriage Hall, Restaurant & Hotel",
  description:
    "Three exceptional experiences under one roof — a magnificent marriage hall, a fine dining restaurant, and a boutique luxury hotel.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <SmoothScroll />
          <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#07070d" }}>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <WhatsAppButton />
          <CustomCursor />
          <IntroScreen />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}