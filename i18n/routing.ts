import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "hi"] as const,
  defaultLocale: "en",
  localePrefix: "as-needed", // English: "/", Hindi: "/hi"
});

export type Locale = (typeof routing.locales)[number];
