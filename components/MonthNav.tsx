"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { MESI } from "@/lib/date";

export default function MonthNav({ mese, anno }: { mese: number; anno: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function go(newMese: number, newAnno: number) {
    const p = new URLSearchParams(params.toString());
    p.set("mese", String(newMese));
    p.set("anno", String(newAnno));
    router.push(`${pathname}?${p.toString()}`);
  }

  function prev() {
    if (mese === 1) go(12, anno - 1);
    else go(mese - 1, anno);
  }

  function next() {
    if (mese === 12) go(1, anno + 1);
    else go(mese + 1, anno);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
      <button onClick={prev} style={navBtnStyle} aria-label="Mese precedente">
        ←
      </button>
      <span className="tabular" style={{ fontSize: 15, minWidth: 160, textAlign: "center" }}>
        {MESI[mese - 1]} {anno}
      </span>
      <button onClick={next} style={navBtnStyle} aria-label="Mese successivo">
        →
      </button>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  border: "1px solid var(--line)",
  background: "var(--card)",
  borderRadius: 12,
  width: 32,
  height: 32,
  cursor: "pointer",
  fontSize: 14,
};
