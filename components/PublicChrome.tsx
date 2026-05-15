"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CustomCursor } from "./CustomCursor";
import { SmoothScroll } from "./SmoothScroll";
import { WhatsAppButton } from "./WhatsAppButton";
import { IntroScreen } from "./IntroScreen";

/** Matches /admin, /en/admin, /hi/admin and any nested admin route.
 *  The admin surface has its own shell — none of the marketing chrome
 *  (navbar, footer, cursor, intro animation) belongs there. */
function isAdminPath(pathname: string): boolean {
  return /^\/(?:(?:en|hi)\/)?admin(?:\/|$)/.test(pathname);
}

export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  if (isAdminPath(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <SmoothScroll />
      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: "#07070d" }}
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <WhatsAppButton />
      <CustomCursor />
      <IntroScreen />
    </>
  );
}
