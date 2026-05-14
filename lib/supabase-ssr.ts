import "server-only";
import { cookies } from "next/headers";
import {
  createServerClient,
  type CookieMethodsServer,
} from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cookie-bound Supabase client for server components and route handlers.
 * Reads the auth session from Next's cookie store so `supabase.auth.getUser()`
 * works inside RSCs. Don't memoize at module scope — cookie context is per-
 * request, so we create a fresh client per call.
 *
 * Writes through this client respect RLS. For admin-only writes that need to
 * bypass RLS (e.g. inserting into room_bookings as the admin), use
 * `lib/supabase-admin.ts` instead.
 */
export async function getSupabaseSSRClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
    );
  }

  const cookieStore = await cookies();
  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      } catch {
        // Called from a Server Component — Next disallows cookie writes here.
        // The middleware (`proxy.ts`) refreshes sessions for us, so swallowing
        // this is safe.
      }
    },
  };

  return createServerClient(url, anonKey, { cookies: cookieMethods });
}
