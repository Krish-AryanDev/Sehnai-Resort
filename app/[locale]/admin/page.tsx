import { redirect } from "next/navigation";

/** /admin → /admin/bookings (or the login gate kicks in if not authed). */
export default function AdminIndex() {
  redirect("/admin/bookings");
}
