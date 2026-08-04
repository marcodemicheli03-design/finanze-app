import { formatEuro } from "@/lib/date";

const COLORS = [
  "var(--pie-1)",
  "var(--pie-2)",
  "var(--pie-3)",
  "var(--pie-4)",
  "var(--pie-5)",
  "var(--pie-6)",
];

export default function PieChart({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  const totale = items.reduce((s, i) => s + i.value, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  let cursore = 0;
  const archi = items.map((item, i) => {
    const frazione = totale > 0 ? item.value / totale : 0;
    const lunghezza = frazione * circumference;
    const arco = {
      color: COLORS[i % COLORS.length],
      dasharray: `${lunghezza} ${circumference - lunghezza}`,
      offset: -cursore,
      pct: frazione * 100,
    };
    cursore += lunghezza;
    return arco;
  });

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--line)" strokeWidth="16" />
        {archi.map((a, i) => (
          <circle
            key={i}
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={a.color}
            strokeWidth="16"
            strokeDasharray={a.dasharray}
            strokeDashoffset={a.offset}
            transform="rotate(-90 70 70)"
          />
        ))}
        <text
          x="70"
          y="75"
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill="var(--ink)"
          fontFamily="var(--font-num)"
        >
          {formatEuro(totale)}
        </text>
      </svg>
      <div style={{ display: "grid", gap: 6, flex: 1, minWidth: 140 }}>
        {items.slice(0, 6).map((item, i) => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: COLORS[i % COLORS.length],
                  display: "inline-block",
                }}
              />
              {item.label}
            </span>
            <span className="tabular" style={{ color: "var(--ink-soft)" }}>
              {totale > 0 ? Math.round((item.value / totale) * 100) : 0}%
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>Nessun dato per questo periodo.</p>
        )}
      </div>
    </div>
  );
}
