"use server";

import { redirect } from "next/navigation";
import { getSupabaseSSRClient } from "@/lib/supabase-ssr";
import { isAdminEmail } from "@/lib/admin-auth";

/**
 * Email + password sign-in. The user must (a) authenticate against Supabase
 * and (b) be on the single-admin allowlist. The allowlist check runs after
 * a successful sign-in — if the wrong account somehow has a password, we
 * sign them right back out before they touch any admin page.
 */
export async function signInWithPassword(formData: FormData): Promise<never> {
  const rawEmail = (formData.get("email") ?? "").toString().trim();
  const email = rawEmail.toLowerCase();
  const password = (formData.get("password") ?? "").toString();
  const params = new URLSearchParams({ email });

  if (!email || !password) {
    params.set("error", "missing_fields");
    redirect(`/admin/login?${params.toString()}`);
  }
  if (!isAdminEmail(email)) {
    // Reject before hitting Supabase so off-list addresses can't probe whether
    // an account exists.
    params.set("error", "not_admin");
    redirect(`/admin/login?${params.toString()}`);
  }

  const supabase = await getSupabaseSSRClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    params.set("error", "invalid_credentials");
    redirect(`/admin/login?${params.toString()}`);
  }

  // Belt-and-brace: the email matched the allowlist when we sent the form,
  // but the user's Supabase email could differ if the row was tampered with.
  if (!isAdminEmail(data.user.email)) {
    await supabase.auth.signOut();
    params.set("error", "not_admin");
    redirect(`/admin/login?${params.toString()}`);
  }

  redirect("/admin/bookings");
}
