/**
 * Hand-rolled SVG bar chart. Server-renderable, zero JS, zero deps.
 *
 * Designed for the dashboard's "last 12 months" series. Single colour,
 * static value labels on top of each bar — no client-side tooltip
 * machinery. Y-axis is implicit from the labelled bars; X-axis just
 * shows month abbreviations.
 *
 * If/when a chart needs interactivity (zoom, hover details, multi-series),
 * promote to Recharts — but for two read-only bar charts on an admin-only
 * page, this is 50 lines of SVG instead of 100kb of D3.
 */

type Datum = {
  label: string;       // x-axis label ("May")
  value: number;       // bar height
  display?: string;    // pretty value shown above the bar ("₹12k")
  sub?: string;        // smaller text below the label (year, e.g. "2026")
};

export function BarChart({
  data,
  color = "#0f766e",
  height = 200,
}: {
  data: Datum[];
  color?: string;
  height?: number;
}) {
  if (data.length === 0) {
    return <div className="dash-chart-empty">No data yet.</div>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  // Use a fixed viewBox; SVG scales to container width via width="100%".
  const width = 600;
  const padL = 8;
  const padR = 8;
  const padTop = 24;      // room for value labels above the tallest bar
  const padBottom = 32;   // room for x-axis labels
  const chartH = height - padTop - padBottom;
  const bandW = (width - padL - padR) / data.length;
  const barW = Math.min(36, bandW * 0.6);

  return (
    <svg
      className="dash-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Bar chart"
      preserveAspectRatio="none"
    >
      {/* Faint baseline */}
      <line
        x1={padL}
        x2={width - padR}
        y1={height - padBottom}
        y2={height - padBottom}
        stroke="#e7e5e4"
        strokeWidth={1}
      />

      {data.map((d, i) => {
        const barH = max > 0 ? (d.value / max) * chartH : 0;
        const x = padL + i * bandW + (bandW - barW) / 2;
        const y = height - padBottom - barH;

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(barH, d.value > 0 ? 2 : 0)}
              rx={2}
              fill={color}
              opacity={d.value > 0 ? 1 : 0.18}
            >
              <title>{`${d.label}${d.sub ? " " + d.sub : ""}: ${d.display ?? d.value}`}</title>
            </rect>

            {d.value > 0 && d.display && (
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize={10}
                fill="#57534e"
                fontWeight={600}
              >
                {d.display}
              </text>
            )}

            <text
              x={x + barW / 2}
              y={height - padBottom + 14}
              textAnchor="middle"
              fontSize={11}
              fill="#78716c"
            >
              {d.label}
            </text>

            {d.sub && (
              <text
                x={x + barW / 2}
                y={height - padBottom + 26}
                textAnchor="middle"
                fontSize={9}
                fill="#a8a29e"
              >
                {d.sub}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
