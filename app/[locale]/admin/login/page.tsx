import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { getAdminUser } from "@/lib/admin-auth";

type SearchParams = { error?: string; email?: string };

/** Email + password login. If the visitor is already authed and on the
 *  allowlist, bounce them straight to /admin/bookings. */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getAdminUser();
  if (user) redirect("/admin/bookings");

  const { error, email } = await searchParams;

  return (
    <div className="admin-card" style={{ maxWidth: 420, margin: "3rem auto" }}>
      <h1 className="admin-h1">Sign in</h1>
      <p style={{ color: "#57534e", marginBottom: "1.25rem" }}>
        Admin access only. Use the email and password the resort owner
        configured.
      </p>

      {error === "missing_fields" && (
        <div className="admin-alert admin-alert--error">
          Enter both your email and password.
        </div>
      )}
      {error === "invalid_credentials" && (
        <div className="admin-alert admin-alert--error">
          That email and password combination isn&apos;t valid.
        </div>
      )}
      {error === "not_admin" && (
        <div className="admin-alert admin-alert--error">
          That account isn&apos;t on the admin allowlist.
        </div>
      )}

      <LoginForm defaultEmail={email ?? ""} />
    </div>
  );
}
