import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Combined middleware: i18n routing + Supabase session refresh.
 *
 * i18n runs first (may issue a locale redirect). On any non-redirect response
 * we hand the same response object to Supabase so refreshed auth cookies are
 * attached to whichever response the client receives. Without this, the
 * admin session would silently expire on every page load.
 *
 * The Supabase refresh is skipped entirely when env isn't configured, so the
 * public site keeps working in env-less dev / build sandboxes.
 */
export default async function proxy(request: NextRequest) {
  const response = intlMiddleware(request);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Triggers a refresh if the access token is near expiry and writes the new
  // cookies via setAll(). The user object itself is ignored here — gating
  // happens inside admin server components via requireAdmin().
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
