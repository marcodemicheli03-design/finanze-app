import { createClient } from "@/lib/supabase/server";
import PieChart from "@/components/PieChart";
import { formatEuro } from "@/lib/date";
import { calcolaPatrimonio } from "@/lib/patrimonio";

export default async function PatrimonioPage() {
  const supabase = createClient();
  const p = await calcolaPatrimonio(supabase);

  const composizione = [
    { label: "Liquidità senza buoni", value: Math.max(0, p.liquiditaSpendibile) },
    { label: "Buoni pasto", value: Math.max(0, p.saldoBuoniPasto) },
    { label: "Investito", value: Math.max(0, p.totaleInvestito) },
  ];

  return (
    <main style={{ padding: "24px 20px 32px", maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>Patrimonio</h1>

      <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Patrimonio totale</div>
          <div className="tabular" style={{ fontSize: 30, fontWeight: 700 }}>{formatEuro(p.patrimonioTotale)}</div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>liquidità (con buoni) + investito</div>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Liquidità con buoni pasto</div>
            <div className="tabular" style={{ fontSize: 22, fontWeight: 700 }}>{formatEuro(p.liquiditaConBuoni)}</div>
            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>tutto tranne gli investimenti</div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Liquidità senza buoni</div>
            <div className="tabular" style={{ fontSize: 22, fontWeight: 700 }}>{formatEuro(p.liquiditaSpendibile)}</div>
            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>esclusi buoni pasto e investimenti</div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Buoni pasto</div>
            <div className="tabular" style={{ fontSize: 22, fontWeight: 700 }}>{formatEuro(p.saldoBuoniPasto)}</div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Investito</div>
            <div className="tabular" style={{ fontSize: 22, fontWeight: 700 }}>{formatEuro(p.totaleInvestito)}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 12 }}>Composizione del patrimonio</div>
        <PieChart items={composizione} />
      </div>
    </main>
  );
}
