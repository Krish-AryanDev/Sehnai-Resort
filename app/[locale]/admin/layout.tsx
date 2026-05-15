import "./admin.css";
import { AdminSidebar } from "./_components/AdminSidebar";
import { getAdminUser } from "@/lib/admin-auth";

/** Admin shell. Left sidebar + content area on desktop; on mobile the
 *  sidebar collapses into a horizontal icon-strip at the top.
 *
 *  Auth gate lives in each child page (or in /admin/login's anti-gate)
 *  so the login page itself stays public. The sidebar renders without
 *  navigation when no user is signed in. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();

  return (
    <div className="admin-root">
      {user && <AdminSidebar userEmail={user.email ?? null} />}
      <main className="admin-main">{children}</main>
    </div>
  );
}
