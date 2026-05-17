/** Veg / non-veg indicator — duplicated intentionally from MenuClient so
 *  the order surface stays decoupled from the parchment menu file. */
export function VegDot({ veg, size = 12 }: { veg: boolean; size?: number }) {
  const stroke = veg ? "#3F7D2A" : "#A52A2A";
  const inner = Math.max(4, Math.round(size / 2));
  return (
    <span
      aria-label={veg ? "Vegetarian" : "Non-vegetarian"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        border: `1.5px solid ${stroke}`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: inner,
          height: inner,
          borderRadius: "50%",
          backgroundColor: stroke,
        }}
      />
    </span>
  );
}
