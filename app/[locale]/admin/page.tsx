import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getDashboardStats } from "@/lib/admin-stats";
import { BarChart } from "./_components/BarChart";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const result = await getDashboardStats();
  if (!result.ok) {
    return (
      <div>
        <h1 className="admin-h1">Dashboard</h1>
        <div className="admin-alert admin-alert--error">
          Failed to load dashboard stats: {result.reason}
        </div>
      </div>
    );
  }

  const { totals, monthlySeries, topVariants, recentBookings } = result.stats;

  const topVariantMax = Math.max(...topVariants.map((v) => v.revenue), 1);

  return (
    <div>
      <h1 className="admin-h1">Dashboard</h1>

      {/* KPI cards */}
      <div className="dash-kpi-grid">
        {(() => {
          const revDelta = computeDelta(
            totals.thisMonthRevenue,
            totals.lastMonthRevenue,
            formatINR
          );
          const bookDelta = computeDelta(
            totals.thisMonthBookings,
            totals.lastMonthBookings,
            (v) => String(v)
          );
          return (
            <>
              <KpiCard
                label="Revenue this month"
                value={formatINR(totals.thisMonthRevenue)}
                delta={revDelta.text}
                deltaTone={revDelta.tone}
              />
              <KpiCard
                label="Bookings this month"
                value={String(totals.thisMonthBookings)}
                delta={bookDelta.text}
                deltaTone={bookDelta.tone}
              />
              <KpiCard
                label="Total revenue (all-time)"
                value={formatINR(totals.confirmedRevenue)}
                delta={
                  totals.confirmedBookings > 0
                    ? `${totals.confirmedBookings} confirmed booking${totals.confirmedBookings === 1 ? "" : "s"}`
                    : "No bookings yet"
                }
                deltaTone="flat"
              />
              <KpiCard
                label="Avg booking value"
                value={
                  totals.avgBookingValue > 0
                    ? formatINR(totals.avgBookingValue)
                    : "—"
                }
                delta={
                  totals.pendingBookings > 0
                    ? `${totals.pendingBookings} pending in flight`
                    : "No pending payments"
                }
                deltaTone="flat"
              />
            </>
          );
        })()}
      </div>

      {/* Charts row */}
      <div className="dash-row dash-row--charts">
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Revenue · last 12 months</span>
            <span className="dash-card-sub">By booking created date</span>
          </div>
          <BarChart
            data={monthlySeries.map((m) => ({
              label: m.label,
              value: m.revenue,
              display: m.revenue > 0 ? compactINR(m.revenue) : "",
            }))}
            color="#0f766e"
          />
        </div>
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Bookings · last 12 months</span>
            <span className="dash-card-sub">Confirmed only</span>
          </div>
          <BarChart
            data={monthlySeries.map((m) => ({
              label: m.label,
              value: m.bookings,
              display: m.bookings > 0 ? String(m.bookings) : "",
            }))}
            color="#854d0e"
          />
        </div>
      </div>

      {/* Recent bookings + top variants */}
      <div className="dash-row dash-row--lists">
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Recent activity</span>
            <Link href="/admin/bookings" className="admin-link">
              View all →
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <p style={{ color: "#a8a29e", fontSize: 13, padding: "0.5rem 0" }}>
              No bookings yet.
            </p>
          ) : (
            <div className="dash-recent">
              {recentBookings.map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/bookings/${b.id}`}
                  className="dash-recent-row"
                >
                  <div className="dash-recent-main">
                    <div className="dash-recent-title">
                      {b.guestName || `${b.variantName} block`}{" "}
                      <span
                        className={`admin-pill admin-pill--${b.status}`}
                        style={{ marginLeft: 4 }}
                      >
                        {b.status}
                      </span>
                    </div>
                    <div className="dash-recent-meta">
                      Room {b.roomNumber} · {b.variantName} ·{" "}
                      {formatDateShort(b.checkIn)} →{" "}
                      {formatDateShort(b.checkOut)} ({b.nights}n)
                    </div>
                  </div>
                  <div className="dash-recent-total">
                    {b.total > 0 ? formatINR(b.total) : "—"}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#a8a29e",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {b.source}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Top rooms by revenue</span>
          </div>
          {topVariants.length === 0 ? (
            <p style={{ color: "#a8a29e", fontSize: 13, padding: "0.5rem 0" }}>
              No revenue data yet.
            </p>
          ) : (
            <div className="dash-variants">
              {topVariants.map((v) => (
                <div key={v.variantId} className="dash-variant-row">
                  <span className="dash-variant-name">{v.variantName}</span>
                  <span className="dash-variant-total">
                    {formatINR(v.revenue)}
                  </span>
                  <div className="dash-variant-bar">
                    <div
                      className="dash-variant-bar-fill"
                      style={{
                        width: `${Math.max(2, (v.revenue / topVariantMax) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="dash-variant-sub">
                    {v.categoryName} · {v.bookings} booking
                    {v.bookings === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Small presentational helpers ---------- */

function KpiCard({
  label,
  value,
  delta,
  deltaTone,
}: {
  label: string;
  value: string;
  delta: string;
  deltaTone?: "up" | "down" | "flat";
}) {
  return (
    <div className="dash-kpi">
      <span className="dash-kpi-label">{label}</span>
      <span className="dash-kpi-value">{value}</span>
      <span className={`dash-kpi-delta dash-kpi-delta--${deltaTone ?? "flat"}`}>
        {delta}
      </span>
    </div>
  );
}

type DeltaTone = "up" | "down" | "flat";

function computeDelta(
  current: number,
  previous: number,
  fmt: (v: number) => string
): { text: string; tone: DeltaTone } {
  if (previous === 0 && current === 0) {
    return { text: "No change from last month", tone: "flat" };
  }
  if (previous === 0) {
    return { text: `+${fmt(current)} vs last month`, tone: "up" };
  }
  const diff = current - previous;
  if (diff === 0) return { text: "Flat vs last month", tone: "flat" };
  const sign = diff > 0 ? "+" : "−";
  const pct = Math.abs(Math.round((diff / previous) * 100));
  return {
    text: `${sign}${fmt(Math.abs(diff))} (${sign}${pct}%) vs last month`,
    tone: diff > 0 ? "up" : "down",
  };
}

function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

/** Compact INR for chart labels: ₹12.5k, ₹1.2L, ₹4.8Cr. */
function compactINR(n: number): string {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}
