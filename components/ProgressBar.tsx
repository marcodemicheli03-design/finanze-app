export default function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div>
      <div
        style={{
          height: 6,
          background: "var(--line)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "var(--ink)",
          }}
        />
      </div>
      <div className="tabular" style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>
        {done}/{total} rate — {pct}%
      </div>
    </div>
  );
}
