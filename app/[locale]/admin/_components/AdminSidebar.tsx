"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, CalendarDays } from "lucide-react";
import type { ReactNode } from "react";
import { AdminSignOutButton } from "./AdminSignOutButton";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  /** Match strategy: "exact" only highlights when pathname matches exactly,
   *  "prefix" highlights when pathname starts with href + "/" too. The
   *  dashboard route is /admin (the root), so it needs "exact" — otherwise
   *  it would highlight on every nested route. */
  match: "exact" | "prefix";
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: <LayoutDashboard size={16} />,
    match: "exact",
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: <ListChecks size={16} />,
    match: "prefix",
  },
  {
    href: "/admin/calendar",
    label: "Calendar",
    icon: <CalendarDays size={16} />,
    match: "prefix",
  },
];

/** Strip the optional /{locale} prefix so highlighting works whether the
 *  user is on /admin/foo or /hi/admin/foo. */
function normalizePath(p: string): string {
  return p.replace(/^\/(en|hi)(?=\/|$)/, "") || "/";
}

function isActive(pathname: string, item: NavItem): boolean {
  const path = normalizePath(pathname);
  if (item.match === "exact") return path === item.href;
  // prefix: match self or any nested child, but a more-specific sibling
  // (e.g. "/admin/bookings/new") takes precedence and is handled by
  // checking exact matches first in the caller below.
  return path === item.href || path.startsWith(item.href + "/");
}

export function AdminSidebar({
  userEmail,
}: {
  userEmail: string | null;
}) {
  const pathname = usePathname() ?? "/";

  // Compute active item with precedence: exact matches beat prefix matches,
  // so /admin/bookings/new highlights "New block" not "Bookings".
  let activeIndex = -1;
  for (let i = 0; i < NAV_ITEMS.length; i++) {
    if (NAV_ITEMS[i].match === "exact" && isActive(pathname, NAV_ITEMS[i])) {
      activeIndex = i;
      break;
    }
  }
  if (activeIndex === -1) {
    activeIndex = NAV_ITEMS.findIndex((it) => isActive(pathname, it));
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <span className="admin-sidebar-brand-mark" aria-hidden>SR</span>
        <span className="admin-sidebar-brand-text">Shehnai · Admin</span>
      </div>

      <nav className="admin-sidebar-nav" aria-label="Admin sections">
        {NAV_ITEMS.map((item, i) => (
          <Link
            key={item.href + ":" + item.label}
            href={item.href}
            className={
              "admin-sidebar-link" +
              (i === activeIndex ? " admin-sidebar-link--active" : "")
            }
            aria-current={i === activeIndex ? "page" : undefined}
          >
            <span className="admin-sidebar-link-icon">{item.icon}</span>
            <span className="admin-sidebar-link-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      {userEmail && (
        <div className="admin-sidebar-footer">
          <p
            className="admin-sidebar-user"
            title={userEmail}
            aria-label={`Signed in as ${userEmail}`}
          >
            {userEmail}
          </p>
          <AdminSignOutButton />
        </div>
      )}
    </aside>
  );
}
