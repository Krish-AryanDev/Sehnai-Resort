import "./admin.css";
import Link from "next/link";
import { AdminSignOutButton } from "./_components/AdminSignOutButton";
import { getAdminUser } from "@/lib/admin-auth";

/** Admin shell. The auth gate lives in each child page (or in the login
 *  route's own anti-gate) so that /admin/login itself stays public.
 *
 *  We just render the user-aware top bar here. Pages that require auth
 *  call `requireAdmin()` themselves.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();

  return (
    <div className="admin-root">
      <header className="admin-header">
        <Link href="/admin/bookings" className="admin-brand">
          Shehnai · Admin
        </Link>
        {user ? (
          <div className="admin-userbar">
            <nav className="admin-nav">
              <Link href="/admin/bookings">Bookings</Link>
              <Link href="/admin/calendar">Calendar</Link>
              <Link href="/admin/bookings/new">New block</Link>
            </nav>
            <span className="admin-email">{user.email}</span>
            <AdminSignOutButton />
          </div>
        ) : null}
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
