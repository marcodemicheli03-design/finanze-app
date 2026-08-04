import { formatEuro } from "@/lib/date";

export default function BarList({
  items,
  color,
}: {
  items: { label: string; value: number }[];
  color: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const totale = items.reduce((s, i) => s + i.value, 0);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((item) => {
        const pctOfMax = (item.value / max) * 100;
        const pctOfTotal = totale > 0 ? (item.value / totale) * 100 : 0;
        return (
          <div key={item.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 4,
              }}
            >
              <span>{item.label}</span>
              <span className="tabular" style={{ color: "var(--ink-soft)" }}>
                {formatEuro(item.value)} · {pctOfTotal.toFixed(0)}%
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: "var(--line)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pctOfMax}%`,
                  background: color,
                  borderRadius: 12,
                }}
              />
            </div>
          </div>
        );
      })}
      {items.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Nessun dato per questo mese.</p>
      )}
    </div>
  );
}
