import Link from "next/link";
import {
  ConciergeBell,
  ChefHat,
  Soup,
  PackageCheck,
  Bike,
  AlertTriangle,
  CircleDollarSign,
} from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getRestaurantStats,
  KITCHEN_STATUSES,
  type KitchenStatus,
  type RecentOrderSummary,
  type TopItem,
} from "@/lib/restaurant-stats";
import type { Fulfillment, OrderStatus } from "@/lib/order-mutations";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Placed",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const FULFILLMENT_LABEL: Record<Fulfillment, string> = {
  in_room: "In-room",
  takeaway: "Takeaway",
  delivery: "Delivery",
};
const KITCHEN_ICONS: Record<KitchenStatus, React.ReactNode> = {
  placed: <ConciergeBell size={16} />,
  accepted: <ChefHat size={16} />,
  preparing: <Soup size={16} />,
  ready: <PackageCheck size={16} />,
  out_for_delivery: <Bike size={16} />,
};

function inr(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function RestaurantDashboardPage() {
  await requireAdmin();
  const stats = await getRestaurantStats();

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="admin-h1" style={{ marginBottom: 0 }}>
          Restaurant overview
        </h1>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <Link href="/admin/orders" className="admin-button admin-button--secondary">
            All orders
          </Link>
          <Link href="/admin/menu" className="admin-button admin-button--secondary">
            Menu
          </Link>
        </div>
      </div>

      {/* ============================ KPI strip ============================ */}
      <div className="dash-kpi-grid">
        <KpiCard
          label="Today"
          value={`${stats.kpis.today.orders} ${
            stats.kpis.today.orders === 1 ? "order" : "orders"
          }`}
          delta={inr(stats.kpis.today.revenuePaise)}
          tone="up"
        />
        <KpiCard
          label="Last 7 days"
          value={`${stats.kpis.week.orders} ${
            stats.kpis.week.orders === 1 ? "order" : "orders"
          }`}
          delta={inr(stats.kpis.week.revenuePaise)}
          tone="flat"
        />
        <KpiCard
          label="Active in kitchen"
          value={String(stats.kpis.activeInKitchen)}
          delta={
            stats.kpis.activeInKitchen === 0
              ? "Nothing on the stove"
              : "Tap a tile below to drill in"
          }
          tone={stats.kpis.activeInKitchen > 0 ? "up" : "flat"}
        />
        <KpiCard
          label="Pending cash on delivery"
          value={inr(stats.kpis.pendingCod.amountPaise)}
          delta={
            stats.kpis.pendingCod.count === 0
              ? "All cleared"
              : `${stats.kpis.pendingCod.count} order${
                  stats.kpis.pendingCod.count === 1 ? "" : "s"
                } to collect`
          }
          tone={stats.kpis.pendingCod.count > 0 ? "down" : "flat"}
        />
      </div>

      {/* =========================== Kitchen pulse =========================== */}
      <div className="dash-card" style={{ marginTop: "1rem" }}>
        <div className="dash-card-header">
          <span className="dash-card-title">Kitchen pulse</span>
          <span className="dash-card-sub">Click a stage to filter the order list</span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "0.55rem",
            marginTop: "0.25rem",
          }}
        >
          {KITCHEN_STATUSES.map((s) => {
            const count = stats.kitchen[s];
            const active = count > 0;
            return (
              <Link
                key={s}
                href={`/admin/orders?status=${s}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  padding: "0.8rem 0.9rem",
                  border: `1px solid ${active ? "#0f766e" : "#e7e5e4"}`,
                  backgroundColor: active ? "rgba(15,118,110,0.06)" : "#fff",
                  color: active ? "#115e59" : "#57534e",
                  textDecoration: "none",
                  transition: "background 0.12s, border-color 0.12s",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  {KITCHEN_ICONS[s]}
                  {STATUS_LABEL[s]}
                </span>
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    color: active ? "#0f766e" : "#a8a29e",
                    lineHeight: 1,
                  }}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ====================== Recent + Top items row ====================== */}
      <div className="dash-row dash-row--lists">
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Recent orders</span>
            <Link href="/admin/orders" className="admin-link">
              View all →
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <EmptyState>No orders yet. Place one from the storefront to see it here.</EmptyState>
          ) : (
            <div className="dash-recent">
              {stats.recentOrders.map((o) => (
                <RecentOrderRow key={o.id} order={o} />
              ))}
            </div>
          )}
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Top dishes · last 7 days</span>
            <span className="dash-card-sub">By quantity sold</span>
          </div>
          {stats.topItems.length === 0 ? (
            <EmptyState>No sales in the past 7 days.</EmptyState>
          ) : (
            <TopItemsList items={stats.topItems} />
          )}
        </div>
      </div>

      {/* ============================ Menu health ============================ */}
      <div className="dash-card" style={{ marginTop: "1rem" }}>
        <div className="dash-card-header">
          <span className="dash-card-title">Menu health</span>
          <Link href="/admin/menu" className="admin-link">
            Manage menu →
          </Link>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0.85rem",
            marginTop: "0.25rem",
          }}
        >
          <MiniStat
            icon={
              <AlertTriangle
                size={16}
                style={{
                  color: stats.menuHealth.unavailableItems > 0 ? "#b45309" : "#a8a29e",
                }}
              />
            }
            label="Unavailable items"
            value={`${stats.menuHealth.unavailableItems} / ${stats.menuHealth.totalItems}`}
            sub={
              stats.menuHealth.unavailableItems === 0
                ? "Everything on the menu is live"
                : "Hidden from the storefront"
            }
          />
          <MiniStat
            icon={
              <AlertTriangle
                size={16}
                style={{
                  color: stats.menuHealth.hiddenCategories > 0 ? "#b45309" : "#a8a29e",
                }}
              />
            }
            label="Hidden categories"
            value={`${stats.menuHealth.hiddenCategories} / ${stats.menuHealth.totalCategories}`}
            sub={
              stats.menuHealth.hiddenCategories === 0
                ? "All categories visible"
                : "Toggled off in /admin/menu"
            }
          />
          <MiniStat
            icon={<CircleDollarSign size={16} style={{ color: "#0f766e" }} />}
            label="Average order value"
            value={
              stats.kpis.week.orders > 0
                ? inr(Math.round(stats.kpis.week.revenuePaise / stats.kpis.week.orders))
                : "—"
            }
            sub="Last 7 days · non-cancelled"
          />
        </div>
      </div>
    </div>
  );
}

/* ===================================================================
 * Subcomponents
 * =================================================================== */

function KpiCard({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "up" | "down" | "flat";
}) {
  return (
    <div className="dash-kpi">
      <span className="dash-kpi-label">{label}</span>
      <span className="dash-kpi-value">{value}</span>
      <span className={`dash-kpi-delta dash-kpi-delta--${tone}`}>{delta}</span>
    </div>
  );
}

function RecentOrderRow({ order }: { order: RecentOrderSummary }) {
  return (
    <Link href={`/admin/orders/${order.id}`} className="dash-recent-row">
      <div className="dash-recent-main">
        <div className="dash-recent-title">
          <span style={{ fontFamily: "monospace", color: "#0f766e", marginRight: 8 }}>
            {order.shortCode}
          </span>
          {order.customerName}
          <span
            className={`admin-pill ${
              order.status === "delivered"
                ? "admin-pill--confirmed"
                : order.status === "cancelled"
                ? "admin-pill--cancelled"
                : "admin-pill--pending"
            }`}
            style={{ marginLeft: 6 }}
          >
            {STATUS_LABEL[order.status]}
          </span>
        </div>
        <div className="dash-recent-meta">
          {FULFILLMENT_LABEL[order.fulfillment]}
          {order.roomNumber && ` · Room ${order.roomNumber}`}
          {" · "}
          {fmtTime(order.createdAt)}
          {" · "}
          {order.paymentMode.toUpperCase()} {order.paymentStatus}
        </div>
      </div>
      <div className="dash-recent-total">{inr(order.totalPaise)}</div>
    </Link>
  );
}

function TopItemsList({ items }: { items: TopItem[] }) {
  const max = Math.max(...items.map((i) => i.qty), 1);
  return (
    <div className="dash-variants">
      {items.map((it) => (
        <div key={it.name} className="dash-variant-row">
          <span className="dash-variant-name">{it.name}</span>
          <span className="dash-variant-total">
            {it.qty} sold
            <span style={{ color: "#a8a29e", fontWeight: 400, marginLeft: 6 }}>
              · {inr(it.revenuePaise)}
            </span>
          </span>
          <div className="dash-variant-bar">
            <div
              className="dash-variant-bar-fill"
              style={{ width: `${Math.max(2, (it.qty / max) * 100)}%` }}
            />
          </div>
          <span className="dash-variant-sub">
            {((it.qty / max) * 100).toFixed(0)}% of the leader
          </span>
        </div>
      ))}
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      style={{
        padding: "0.85rem 1rem",
        border: "1px solid #e7e5e4",
        background: "#fafaf9",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#78716c",
          fontWeight: 600,
        }}
      >
        {icon}
        {label}
      </span>
      <span style={{ fontSize: 22, fontWeight: 600, color: "#1c1917" }}>
        {value}
      </span>
      <span style={{ fontSize: 12, color: "#78716c" }}>{sub}</span>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        color: "#a8a29e",
        fontSize: 13,
        padding: "1rem 0",
        textAlign: "center",
      }}
    >
      {children}
    </p>
  );
}
