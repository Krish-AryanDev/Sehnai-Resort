import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseSSRClient } from "@/lib/supabase-ssr";

/** True if the email is on the single-admin allowlist (env var). Trims +
 *  lowercases both sides so a stray space or capital won't lock the admin out. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!allow) return false;
  return email.trim().toLowerCase() === allow;
}

/** Returns the current Supabase user if logged in AND on the allowlist.
 *  Returns null otherwise (no throw). Use inside server components to
 *  branch on auth state without forcing a redirect. */
export async function getAdminUser(): Promise<User | null> {
  const supabase = await getSupabaseSSRClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  if (!isAdminEmail(data.user.email)) return null;
  return data.user;
}

/** Hard auth gate. Redirects to /admin/login when unauthenticated or off the
 *  allowlist. Use at the top of any admin server component / server action. */
export async function requireAdmin(): Promise<User> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
