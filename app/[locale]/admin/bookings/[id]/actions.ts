"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

/** Cancel a booking by id. Keeps the row for audit — just flips status to
 *  'cancelled', which both the public RLS policy and the read query filter
 *  exclude, so the dates are immediately available again. */
export async function cancelBooking(id: string): Promise<never> {
  await requireAdmin();

  if (!id) redirect("/admin/bookings");

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("room_bookings")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) {
    const params = new URLSearchParams({ error: `Cancel failed: ${error.message}` });
    redirect(`/admin/bookings/${id}?${params.toString()}`);
  }

  revalidatePath("/[locale]/hotel/rooms/[id]", "page");
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);

  redirect("/admin/bookings");
}
