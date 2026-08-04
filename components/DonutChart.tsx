export default function DonutChart({
  pct,
  label,
  sublabel,
}: {
  pct: number;
  label: string;
  sublabel: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth="12"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
        <text
          x="70"
          y="66"
          textAnchor="middle"
          fontSize="24"
          fontWeight="700"
          fill="var(--ink)"
          fontFamily="var(--font-num)"
        >
          {Math.round(clamped)}%
        </text>
        <text x="70" y="86" textAnchor="middle" fontSize="11" fill="var(--ink-soft)">
          {label}
        </text>
      </svg>
      <div style={{ fontSize: 13, color: "var(--ink-soft)", textAlign: "center" }}>{sublabel}</div>
    </div>
  );
}
