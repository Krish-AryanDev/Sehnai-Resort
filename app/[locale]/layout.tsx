import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { PublicChrome } from "@/components/PublicChrome";
import { Analytics } from "@/components/Analytics";

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
        <Analytics />
        <NextIntlClientProvider>
          <PublicChrome>{children}</PublicChrome>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
