"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Google Analytics 4 loader + SPA page_view emitter.
 *
 * - Renders nothing when NEXT_PUBLIC_GA_MEASUREMENT_ID isn't set, so dev /
 *   preview environments stay analytics-free.
 * - Installs a `window.gtag` stub before the GA library loads so any
 *   `track()` calls fired between paint and library-ready get queued via
 *   `dataLayer` and replayed.
 * - Fires `page_view` manually on every pathname/search change because we
 *   disable GA's auto-pageview (it doesn't catch App Router client nav).
 */
export function Analytics() {
  if (!GA_ID) return null;
  return (
    <>
      {/* Stub: makes gtag callable immediately. Real lib replaces it. */}
      <Script id="ga4-stub" strategy="beforeInteractive">
        {`window.dataLayer = window.dataLayer || [];
window.gtag = function(){window.dataLayer.push(arguments);};`}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`gtag('js', new Date());
gtag('config', '${GA_ID}', { send_page_view: false });`}
      </Script>
      <Suspense fallback={null}>
        <RouteChangeTracker />
      </Suspense>
    </>
  );
}

function RouteChangeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID) return;
    if (typeof window === "undefined" || typeof window.gtag !== "function") {
      return;
    }
    const query = searchParams?.toString();
    const page_path = query ? `${pathname}?${query}` : pathname;
    window.gtag("event", "page_view", { page_path });
  }, [pathname, searchParams]);

  return null;
}
