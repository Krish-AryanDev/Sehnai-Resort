"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function AdminSignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="admin-button admin-button--secondary"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const supabase = getSupabaseBrowserClient();
          await supabase.auth.signOut();
          router.replace("/admin/login");
          router.refresh();
        });
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
