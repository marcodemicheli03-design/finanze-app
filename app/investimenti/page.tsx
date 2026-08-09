import { createClient } from "@/lib/supabase/server";
import { addInvestment, deleteInvestment } from "@/app/actions";
import PeriodFilter from "@/components/PeriodFilter";
import PieChart from "@/components/PieChart";
import { formatEuro, todayLocalISO } from "@/lib/date";
import { getPeriodo } from "@/lib/periodo";
import { breakdownInvestimentiNelPeriodo } from "@/lib/patrimonio";

export default async function InvestimentiPage({
  searchParams,
}: {
  searchParams: { p?: string; ref?: string; da?: string; a?: string };
}) {
  const supabase = createClient();
  const periodo = getPeriodo(searchParams);

  const { data: investments } = await supabase
    .from("investments")
    .select("*")
    .gte("data", periodo.start)
    .lt("data", periodo.end)
    .order("data", { ascending: true });

  const { data: tutti } = await supabase.from("investments").select("importo");
  const totaleStorico = (tutti ?? []).reduce((s, i) => s + Number(i.importo), 0);
  const totalePeriodo = (investments ?? []).reduce((s, i) => s + Number(i.importo), 0);
  const breakdown = await breakdownInvestimentiNelPeriodo(supabase, "2000-01-01", periodo.end);

  return (
    <main style={{ padding: "24px 20px 32px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Investimenti</h1>
        <details>
          <summary style={addBtnStyle}>+ Aggiungi</summary>
          <form
            action={addInvestment}
            className="card"
            style={{ padding: 16, marginTop: 8, display: "grid", gap: 8, position: "absolute", right: 20, zIndex: 10, width: 260 }}
          >
            <input name="nome" placeholder="Nome (es. VUSA)" required style={inputStyle} />
            <select name="tipo" required style={inputStyle} defaultValue="ETF">
              <option value="ETF">ETF</option>
              <option value="Stock">Stock</option>
              <option value="Crypto">Crypto</option>
              <option value="Altro">Altro</option>
            </select>
            <input name="data" type="date" required style={inputStyle} defaultValue={todayLocalISO()} />
            <input name="importo" type="number" step="0.01" placeholder="Importo versato" required style={inputStyle} />
            <input name="quote" type="number" step="0.000001" placeholder="Quote (opzionale)" style={inputStyle} />
            <button type="submit" style={btnStyle}>Aggiungi</button>
          </form>
        </details>
      </div>

      <PeriodFilter />

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Versato — {periodo.label}</div>
          <div className="tabular" style={{ fontSize: 22, fontWeight: 700 }}>{formatEuro(totalePeriodo)}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Totale investito (storico)</div>
          <div className="tabular" style={{ fontSize: 22, fontWeight: 700 }}>{formatEuro(totaleStorico)}</div>
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 12 }}>Composizione per strumento</div>
          <PieChart items={breakdown} />
        </div>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        {(investments ?? []).map((i, idx) => (
          <div
            key={i.id}
            style={{
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: idx < (investments?.length ?? 0) - 1 ? "1px solid var(--line)" : "none",
            }}
          >
            <div>
              <div style={{ fontSize: 14 }}>{i.nome} <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>({i.tipo})</span></div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                {new Date(i.data).toLocaleDateString("it-IT")}
                {i.quote ? ` · ${Number(i.quote).toFixed(4)} quote` : ""}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="tabular">{formatEuro(i.importo)}</span>
              <form action={deleteInvestment.bind(null, i.id)}>
                <button type="submit" style={deleteBtnStyle} aria-label="Elimina">✕</button>
              </form>
            </div>
          </div>
        ))}
        {(investments ?? []).length === 0 && (
          <p style={{ fontSize: 14, color: "var(--ink-soft)", padding: 20 }}>Nessun investimento in questo periodo.</p>
        )}
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
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

const addBtnStyle: React.CSSProperties = {
  padding: "8px 14px",
  background: "var(--accent)",
  color: "white",
  borderRadius: 999,
  fontSize: 13,
  cursor: "pointer",
};

const deleteBtnStyle: React.CSSProperties = {
  border: "none",
  background: "none",
  color: "var(--ink-soft)",
  cursor: "pointer",
  fontSize: 13,
};
