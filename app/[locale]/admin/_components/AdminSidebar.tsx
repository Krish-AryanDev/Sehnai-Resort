"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  UtensilsCrossed,
  ConciergeBell,
  ChartLine,
  SlidersHorizontal,
} from "lucide-react";
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

type NavGroup = {
  /** Section heading shown above the group on desktop. Hidden on mobile —
   *  groups render as icon clusters separated by a divider instead. */
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Hotel",
    items: [
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
    ],
  },
  {
    label: "Restaurant",
    items: [
      {
        href: "/admin/restaurant",
        label: "Overview",
        icon: <ChartLine size={16} />,
        match: "prefix",
      },
      {
        href: "/admin/orders",
        label: "Orders",
        icon: <ConciergeBell size={16} />,
        match: "prefix",
      },
      {
        href: "/admin/menu",
        label: "Menu",
        icon: <UtensilsCrossed size={16} />,
        match: "prefix",
      },
      {
        href: "/admin/restaurant-settings",
        label: "Settings",
        icon: <SlidersHorizontal size={16} />,
        match: "prefix",
      },
    ],
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
  return path === item.href || path.startsWith(item.href + "/");
}

export function AdminSidebar({
  userEmail,
}: {
  userEmail: string | null;
}) {
  const pathname = usePathname() ?? "/";

  // Flatten to compute active item once; exact matches beat prefix matches so
  // /admin/bookings/new highlights the right row instead of falling back to
  // the dashboard via its exact match on "/admin".
  const flat = NAV_GROUPS.flatMap((g) => g.items);
  let activeHref: string | null = null;
  for (const it of flat) {
    if (it.match === "exact" && isActive(pathname, it)) {
      activeHref = it.href;
      break;
    }
  }
  if (!activeHref) {
    const fallback = flat.find((it) => isActive(pathname, it));
    activeHref = fallback?.href ?? null;
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <span className="admin-sidebar-brand-mark" aria-hidden>
          SR
        </span>
        <span className="admin-sidebar-brand-text">Shehnai · Admin</span>
      </div>

      <nav className="admin-sidebar-nav" aria-label="Admin sections">
        {NAV_GROUPS.map((group) => (
          <div
            key={group.label}
            className="admin-sidebar-group"
            role="group"
            aria-label={group.label}
          >
            <h3 className="admin-sidebar-group-label">{group.label}</h3>
            {group.items.map((item) => {
              const active = item.href === activeHref;
              return (
                <Link
                  key={item.href + ":" + item.label}
                  href={item.href}
                  className={
                    "admin-sidebar-link" +
                    (active ? " admin-sidebar-link--active" : "")
                  }
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                >
                  <span className="admin-sidebar-link-icon">{item.icon}</span>
                  <span className="admin-sidebar-link-label">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
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
