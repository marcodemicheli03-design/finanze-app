import { createClient } from "@/lib/supabase/server";
import PeriodFilter from "@/components/PeriodFilter";
import DonutChart from "@/components/DonutChart";
import PieChart from "@/components/PieChart";
import BarList from "@/components/BarList";
import { formatEuro } from "@/lib/date";
import { getPeriodo } from "@/lib/periodo";
import {
  calcolaPatrimonio,
  proiettaLiquidita,
  riepilogoPeriodo,
  breakdownFisseNelPeriodo,
  breakdownVariabiliNelPeriodo,
  recapAnni,
} from "@/lib/patrimonio";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { p?: string; ref?: string; da?: string; a?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const periodo = getPeriodo(searchParams);
  const fineSelezionata = new Date(periodo.end);
  fineSelezionata.setDate(fineSelezionata.getDate() - 1);

  const [riepilogo, fisseBars, variabiliBars, patrimonio, proiezione, anni] = await Promise.all([
    riepilogoPeriodo(supabase, periodo.start, periodo.end),
    breakdownFisseNelPeriodo(supabase, periodo.start, periodo.end),
    breakdownVariabiliNelPeriodo(supabase, periodo.start, periodo.end),
    calcolaPatrimonio(supabase),
    proiettaLiquidita(supabase, fineSelezionata.getMonth() + 1, fineSelezionata.getFullYear()),
    recapAnni(supabase),
  ]);

  const { totaleEntrate, totaleFisse, totaleVariabili, risparmio } = riepilogo;
  const speseTotali = totaleFisse + totaleVariabili;

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);
  const goal = goals?.[0];
  const goalPct = goal ? (Number(goal.importo_attuale) / Number(goal.importo_target)) * 100 : 0;

  return (
    <main style={{ padding: "24px 20px 32px", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Finanze</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: 0 }}>{user?.email}</p>
      </div>

      <div style={{ marginTop: 16 }}>
        <PeriodFilter />
      </div>

      {/* Patrimonio */}
      <div
        className="card"
        style={{
          padding: 24,
          marginBottom: 20,
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
            Patrimonio totale {proiezione.proiettato && "(stimato)"}
          </div>
          <div className="tabular" style={{ fontSize: 22, fontWeight: 700 }}>
            {formatEuro(proiezione.patrimonioTotale)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
            Liquidità spendibile {proiezione.proiettato && "(stimata)"}
          </div>
          <div className="tabular" style={{ fontSize: 22, fontWeight: 700 }}>
            {formatEuro(proiezione.liquiditaSpendibile)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Saldo buoni pasto</div>
          <div className="tabular" style={{ fontSize: 22, fontWeight: 700 }}>
            {formatEuro(patrimonio.saldoBuoniPasto)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Totale investito</div>
          <div className="tabular" style={{ fontSize: 22, fontWeight: 700 }}>
            {formatEuro(patrimonio.totaleInvestito)}
          </div>
        </div>
      </div>

      {/* Riepilogo periodo selezionato */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 20 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Entrate</div>
          <div className="tabular positive" style={{ fontSize: 20, fontWeight: 700 }}>{formatEuro(totaleEntrate)}</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Spese totali</div>
          <div className="tabular negative" style={{ fontSize: 20, fontWeight: 700 }}>{formatEuro(speseTotali)}</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Risparmiato</div>
          <div className={`tabular ${risparmio >= 0 ? "positive" : "negative"}`} style={{ fontSize: 20, fontWeight: 700 }}>
            {formatEuro(risparmio)}
          </div>
        </div>
      </div>

      {/* Grafici a torta: panoramica */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 12 }}>Spese fisse — panoramica</div>
          <PieChart items={fisseBars} />
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 12 }}>Spese variabili — panoramica</div>
          <PieChart items={variabiliBars} />
        </div>
      </div>

      {/* Barre: dettaglio */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 16 }}>Spese fisse — dettaglio</div>
          <BarList items={fisseBars} color="var(--bar-fisse)" />
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 16 }}>Spese variabili — dettaglio</div>
          <BarList items={variabiliBars} color="var(--bar-variabili)" />
        </div>
      </div>

      {goal && (
        <div className="card" style={{ padding: 20, marginBottom: 20, display: "flex", justifyContent: "center" }}>
          <DonutChart pct={goalPct} label={goal.nome} sublabel={`${formatEuro(goal.importo_attuale)} / ${formatEuro(goal.importo_target)}`} />
        </div>
      )}

      {/* Recap annuale */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 12 }}>Recap per anno</div>
        <div style={{ display: "grid", gap: 8 }}>
          {anni.map((a) => (
            <div key={a.anno} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{a.anno}{a.anno > new Date().getFullYear() && (
                <span style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 400 }}> (previsto)</span>
              )}</span>
              <div style={{ display: "flex", gap: 16, fontSize: 12 }} className="tabular">
                <span className="positive">+{formatEuro(a.totaleEntrate)}</span>
                <span className="negative">-{formatEuro(a.totaleFisse + a.totaleVariabili)}</span>
                <span className={a.risparmio >= 0 ? "positive" : "negative"} style={{ fontWeight: 700 }}>
                  {formatEuro(a.risparmio)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border: "1px solid var(--line)",
  fontSize: 14,
  background: "var(--card)",
  color: "var(--ink)",
};

const btnStyle: React.CSSProperties = {
  padding: "10px 12px",
  background: "var(--accent)",
  color: "white",
  border: "none",
  fontSize: 14,
  cursor: "pointer",
};
