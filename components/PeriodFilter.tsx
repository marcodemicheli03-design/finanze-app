"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { getPeriodo, shiftRef, type Preset } from "@/lib/periodo";

const PRESET_LABELS: { value: Preset; label: string }[] = [
  { value: "mese", label: "Mese" },
  { value: "trimestre", label: "Trimestre" },
  { value: "anno", label: "Anno" },
  { value: "sempre", label: "Da sempre" },
];

export default function PeriodFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showCustom, setShowCustom] = useState(false);

  const periodo = getPeriodo({
    p: searchParams.get("p") ?? undefined,
    ref: searchParams.get("ref") ?? undefined,
    da: searchParams.get("da") ?? undefined,
    a: searchParams.get("a") ?? undefined,
  });

  function setPreset(preset: Preset) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("p", preset);
    p.delete("da");
    p.delete("a");
    if (!p.get("ref")) p.set("ref", new Date().toISOString().slice(0, 10));
    router.push(`${pathname}?${p.toString()}`);
    setShowCustom(preset === "custom");
  }

  function shift(dir: 1 | -1) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("ref", shiftRef(periodo.preset as Preset, periodo.ref, dir));
    router.push(`${pathname}?${p.toString()}`);
  }

  function applyCustom(formData: FormData) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("p", "custom");
    p.set("da", String(formData.get("da")));
    p.set("a", String(formData.get("a")));
    router.push(`${pathname}?${p.toString()}`);
  }

  const puoiScorrere = periodo.preset !== "sempre" && periodo.preset !== "custom";

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        className="card"
        style={{
          display: "flex",
          gap: 4,
          padding: 6,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {PRESET_LABELS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPreset(opt.value)}
            style={{
              padding: "7px 12px",
              fontSize: 12,
              border: "none",
              cursor: "pointer",
              background: periodo.preset === opt.value ? "var(--accent)" : "transparent",
              color: periodo.preset === opt.value ? "white" : "var(--ink)",
            }}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom((s) => !s)}
          aria-label="Periodo personalizzato"
          style={{
            padding: "7px 10px",
            fontSize: 12,
            border: "none",
            cursor: "pointer",
            background: periodo.preset === "custom" ? "var(--accent)" : "transparent",
            color: periodo.preset === "custom" ? "white" : "var(--ink)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Calendar size={14} />
        </button>

        {puoiScorrere && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
            <button onClick={() => shift(-1)} style={arrowStyle} aria-label="Precedente">
              <ChevronLeft size={16} />
            </button>
            <span className="tabular" style={{ fontSize: 12, minWidth: 90, textAlign: "center" }}>
              {periodo.label}
            </span>
            <button onClick={() => shift(1)} style={arrowStyle} aria-label="Successivo">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
        {!puoiScorrere && (
          <span className="tabular" style={{ fontSize: 12, marginLeft: "auto", padding: "0 8px" }}>
            {periodo.label}
          </span>
        )}
      </div>

      {showCustom && (
        <form
          action={applyCustom}
          className="card"
          style={{ display: "flex", gap: 8, padding: 12, marginTop: 8, flexWrap: "wrap" }}
        >
          <input name="da" type="date" required style={dateInputStyle} />
          <span style={{ alignSelf: "center", fontSize: 12, color: "var(--ink-soft)" }}>a</span>
          <input name="a" type="date" required style={dateInputStyle} />
          <button
            type="submit"
            style={{
              padding: "8px 14px",
              background: "var(--accent)",
              color: "white",
              border: "none",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Applica
          </button>
        </form>
      )}
    </div>
  );
}

const arrowStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "var(--ink)",
  display: "flex",
  alignItems: "center",
  padding: 4,
};

const dateInputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid var(--line)",
  fontSize: 13,
  background: "var(--card)",
  color: "var(--ink)",
};
